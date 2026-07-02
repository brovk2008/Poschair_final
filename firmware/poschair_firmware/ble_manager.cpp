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

class CmdCallback : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) override {
    std::string val = c->getValue();
    CommandPacket pkt;
    if (!parseCommand((const uint8_t*)val.data(), val.length(), pkt)) {
      Serial.println("[BLE] Bad packet (length/header/checksum)");
      return;
    }
    for (int i = 0; i < 6; i++) bleManager._sc->setTarget(i, pkt.angles[i]);
    bleManager._lastPacketMs = millis();
  }
};

void BLEManager::begin(ServoController* sc) {
  _sc = sc;
  _lastPacketMs = millis();

  NimBLEDevice::init(BLE_DEVICE_NAME);
  _server = NimBLEDevice::createServer();
  _server->setCallbacks(new ServerCB());

  NimBLEService* svc = _server->createService(SERVICE_UUID);

  NimBLECharacteristic* cmdChar = svc->createCharacteristic(
    COMMAND_CHAR_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  cmdChar->setCallbacks(new CmdCallback());

  _statusChar = svc->createCharacteristic(
    STATUS_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY
  );

  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->start();
  Serial.println("[BLE] Advertising as " BLE_DEVICE_NAME);
}

bool BLEManager::isConnected() const {
  return _server && _server->getConnectedCount() > 0;
}

void BLEManager::sendStatus(uint16_t batteryMv, bool failsafeActive) {
  if (!_statusChar) return;
  uint8_t flags = 0x01; // bit0 = ok
  if (failsafeActive) flags |= 0x02;
  if (isConnected())   flags |= 0x04;

  uint8_t payload[STATUS_PACKET_SIZE];
  payload[0] = STATUS_HEADER;
  payload[1] = flags;
  payload[2] = (batteryMv >> 8) & 0xFF; // big-endian
  payload[3] = batteryMv & 0xFF;
  for (int i = 0; i < 6; i++) payload[4 + i] = _sc->getCurrentAngle(i);

  _statusChar->setValue(payload, STATUS_PACKET_SIZE);
  _statusChar->notify();
}
