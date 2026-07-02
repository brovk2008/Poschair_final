// BLE UUIDs — must match firmware config.h exactly
const SERVICE_UUID      = 'a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e';
const COMMAND_CHAR_UUID = 'a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e';
const STATUS_CHAR_UUID  = 'a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e';

export interface StatusData {
  flags: number;           // bit0=ok, bit1=failsafe, bit2=connected
  batteryMv: number;
  currentAngles: number[]; // [6]
}

export interface BLEManager {
  connect(): Promise<void>;
  disconnect(): void;
  sendAngles(angles: number[]): void;  // angles[6], each 0–70
  isConnected(): boolean;
  onStatus: ((s: StatusData) => void) | null;
  onDisconnect: (() => void) | null;
}

function buildCommandPacket(angles: number[]): ArrayBuffer {
  const buf = new Uint8Array(8);
  buf[0] = 0xA5; // header
  for (let i = 0; i < 6; i++) buf[i + 1] = Math.min(55, Math.max(0, angles[i]));
  let cs = 0;
  for (let i = 0; i < 7; i++) cs ^= buf[i];
  buf[7] = cs;
  return buf.buffer;
}

function parseStatusPacket(buf: DataView): StatusData | null {
  if (buf.byteLength < 10) return null;
  if (buf.getUint8(0) !== 0x5A) return null;
  return {
    flags: buf.getUint8(1),
    batteryMv: buf.getUint16(2, false), // big-endian
    currentAngles: Array.from({ length: 6 }, (_, i) => buf.getUint8(4 + i)),
  };
}

export function createBLEManager(): BLEManager {
  let device: BluetoothDevice | null = null;
  let cmdChar: BluetoothRemoteGATTCharacteristic | null = null;

  const mgr: BLEManager = {
    onStatus: null,
    onDisconnect: null,

    async connect() {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'POSCHAIR_001' }],
        optionalServices: [SERVICE_UUID],
      });
      device.addEventListener('gattserverdisconnected', () => {
        cmdChar = null;
        mgr.onDisconnect?.();
      });
      const server  = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      cmdChar       = await service.getCharacteristic(COMMAND_CHAR_UUID);
      const statCh  = await service.getCharacteristic(STATUS_CHAR_UUID);
      await statCh.startNotifications();
      statCh.addEventListener('characteristicvaluechanged', (e) => {
        const val = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const parsed = parseStatusPacket(val);
        if (parsed) mgr.onStatus?.(parsed);
      });
    },

    disconnect() {
      device?.gatt?.disconnect();
      cmdChar = null;
    },

    sendAngles(angles: number[]) {
      if (!cmdChar) return;
      cmdChar.writeValueWithoutResponse(buildCommandPacket(angles)).catch(console.error);
    },

    isConnected() {
      return device?.gatt?.connected ?? false;
    },
  };
  return mgr;
}
