#include "ble_manager.h"

BLEManager bleManager;

class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s) override {
    Serial.println("[BLE] Client connected");
  }
  void onDisconnect(NimBLEServer* s) override {
    Serial.println("[BLE] Client disconnected — restarting advertising");
    NimBLEDevice::getAdvertising()->start();
  }
};

// Expose timestamp update: CmdCallback sets it via a free function
static unsigned long* gLastPacketMs = nullptr;
void ble_markPacketReceived() { if (gLastPacketMs) *gLastPacketMs = millis(); }

class CmdCallbackFull : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) override {
    std::string val = c->getValue();
    CommandPacket pkt;
    if (!parseCommand((const uint8_t*)val.data(), val.length(), pkt)) {
      Serial.println("[BLE] Bad packet — dropped");
      return;
    }
    for (int i = 0; i < 6; i++) bleManager._sc->setTarget(i, pkt.angles[i]);
    ble_markPacketReceived();
  }
};

void BLEManager::begin(ServoController* sc) {
  _sc = sc;
  _lastPacketMs = millis();
  gLastPacketMs = &_lastPacketMs;

  NimBLEDevice::init(BLE_DEVICE_NAME);
  _server = NimBLEDevice::createServer();
  _server->setCallbacks(new ServerCB());

  NimBLEService* svc = _server->createService(SERVICE_UUID);

  NimBLECharacteristic* cmdChar = svc->createCharacteristic(
    COMMAND_CHAR_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  cmdChar->setCallbacks(new CmdCallbackFull());

  _statusChar = svc->createCharacteristic(
    STATUS_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY
  );

  svc->start();
  NimBLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  NimBLEDevice::getAdvertising()->start();
  Serial.println("[BLE] Advertising as " BLE_DEVICE_NAME);
}

bool BLEManager::isConnected() const {
  return _server && _server->getConnectedCount() > 0;
}

void BLEManager::sendStatus(uint16_t batteryMv, bool failsafeActive) {
  if (!_statusChar) return;
  uint8_t flags = 0x01;
  if (failsafeActive)  flags |= 0x02;
  if (isConnected())   flags |= 0x04;

  uint8_t payload[STATUS_PACKET_SIZE];
  payload[0] = STATUS_HEADER;
  payload[1] = flags;
  payload[2] = (batteryMv >> 8) & 0xFF;  // big-endian
  payload[3] = batteryMv & 0xFF;
  for (int i = 0; i < 6; i++) payload[4 + i] = _sc->getCurrentAngle(i);

  _statusChar->setValue(payload, STATUS_PACKET_SIZE);
  _statusChar->notify();
}
