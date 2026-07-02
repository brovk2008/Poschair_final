// Web Bluetooth Manager for PosChair Client App

export interface DeviceStatus {
  connected: boolean;
  failsafeActive: boolean;
  batteryMv: number;
  currentAngles: number[];
}

export type StatusCallback = (status: DeviceStatus) => void;

class BLEManager {
  private device: BluetoothDevice | null = null;
  private gattServer: BluetoothRemoteGATTServer | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null; // Notify
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null; // Write

  private serviceUuid = 'a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e';
  private rxCharUuid  = 'a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e';
  private txCharUuid  = 'a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e';

  private statusCallbacks: StatusCallback[] = [];
  public isConnecting = false;

  // Add listener for status updates
  public addStatusListener(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
  }

  // Remove listener
  public removeStatusListener(callback: StatusCallback) {
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
  }

  // Check if connected
  public isConnected(): boolean {
    return this.gattServer?.connected || false;
  }

  // Connect to device
  public async connect(): Promise<boolean> {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth is not supported on this browser/platform. Try Chrome or Edge.");
    }

    try {
      this.isConnecting = true;
      console.log("Scanning for PosChair BLE peripheral...");
      
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'POSCHAIR_001' }],
        optionalServices: [this.serviceUuid]
      });

      console.log("Device found:", this.device.name);
      
      // Connect to GATT
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
      this.gattServer = await this.device.gatt!.connect();
      console.log("GATT server connected.");

      // Get Service
      const service = await this.gattServer.getPrimaryService(this.serviceUuid);
      console.log("Primary service resolved.");

      // Get Characteristics
      this.rxCharacteristic = await service.getCharacteristic(this.rxCharUuid);
      this.txCharacteristic = await service.getCharacteristic(this.txCharUuid);
      console.log("Characteristics loaded.");

      // Set up notification callback
      await this.txCharacteristic.startNotifications();
      this.txCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
      console.log("Notifications subscribed.");

      this.isConnecting = false;
      this.notifyConnectionStateChange();
      return true;
    } catch (error) {
      this.isConnecting = false;
      console.error("BLE Connection failed:", error);
      this.cleanup();
      throw error;
    }
  }

  // Disconnect from device
  public disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  // Send target angles to chair (8-byte binary packet)
  public async sendAngles(angles: number[]): Promise<boolean> {
    if (!this.isConnected() || !this.rxCharacteristic) {
      return false;
    }

    if (angles.length !== 6) {
      throw new Error("Must provide exactly 6 target servo angles");
    }

    try {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);

      // Byte 0: Header (0xA5)
      view.setUint8(0, 0xA5);

      // Bytes 1-6: Target Angles (clamped 0 to 180)
      let checksum = 0xA5;
      for (let i = 0; i < 6; i++) {
        const val = Math.min(180, Math.max(0, Math.round(angles[i])));
        view.setUint8(i + 1, val);
        checksum ^= val;
      }

      // Byte 7: Checksum (XOR)
      view.setUint8(7, checksum);

      // Write value (write without response is faster/non-blocking)
      await this.rxCharacteristic.writeValueWithoutResponse(buffer);
      return true;
    } catch (err) {
      console.error("Failed to send angles packet:", err);
      return false;
    }
  }

  private handleNotification(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value || value.byteLength !== 10) return;

    const view = new DataView(value.buffer);
    
    // Byte 0: Header (0x5A)
    const header = view.getUint8(0);
    if (header !== 0x5A) return;

    // Byte 1: Flags (Bit 0 = Connected, Bit 1 = Failsafe Active)
    const flags = view.getUint8(1);
    const failsafeActive = (flags & 0x02) !== 0;

    // Bytes 2-3: Battery (uint16, big endian)
    const batteryMv = view.getUint16(2, false);

    // Bytes 4-9: Current servo angles
    const currentAngles: number[] = [];
    for (let i = 0; i < 6; i++) {
      currentAngles.push(view.getUint8(4 + i));
    }

    const status: DeviceStatus = {
      connected: true,
      failsafeActive,
      batteryMv,
      currentAngles
    };

    // Dispatch status to all listeners
    this.statusCallbacks.forEach(cb => cb(status));
  }

  private handleDisconnect() {
    console.log("Device disconnected.");
    this.cleanup();
    this.notifyConnectionStateChange();
  }

  private notifyConnectionStateChange() {
    const status: DeviceStatus = {
      connected: this.isConnected(),
      failsafeActive: false,
      batteryMv: 0,
      currentAngles: [90, 90, 90, 90, 90, 90]
    };
    this.statusCallbacks.forEach(cb => cb(status));
  }

  private cleanup() {
    this.device = null;
    this.gattServer = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
  }
}

export const bleManager = new BLEManager();
