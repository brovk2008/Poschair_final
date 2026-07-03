#include "ble_manager.h"

BLEManager bleManager;

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* server, NimBLEConnInfo& connInfo) override {
    Serial.println("[BLE] Client connected");
  }

  void onDisconnect(NimBLEServer* server, NimBLEConnInfo& connInfo, int reason) override {
    Serial.println("[BLE] Client disconnected - restarting advertising");
    NimBLEDevice::getAdvertising()->start();
  }
};

static unsigned long* gLastPacketMs = nullptr;
static void markPacketReceived() {
  if (gLastPacketMs) *gLastPacketMs = millis();
}

class CommandCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* characteristic, NimBLEConnInfo& connInfo) override {
    std::string value = characteristic->getValue();
    CommandPacket packet;

    if (!parseCommand((const uint8_t*)value.data(), value.length(), packet)) {
      Serial.println("[BLE] Bad command packet - dropped");
      return;
    }

    for (int i = 0; i < NUM_MODULES; i++) {
      bleManager._controller->setTarget(i, packet.positions[i]);
    }
    markPacketReceived();
  }
};

void BLEManager::begin(MotorController* controller) {
  _controller = controller;
  _lastPacketMs = millis();
  gLastPacketMs = &_lastPacketMs;

  NimBLEDevice::init(BLE_DEVICE_NAME);
  _server = NimBLEDevice::createServer();
  _server->setCallbacks(new ServerCallbacks());

  NimBLEService* service = _server->createService(SERVICE_UUID);

  NimBLECharacteristic* commandChar = service->createCharacteristic(
    COMMAND_CHAR_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  commandChar->setCallbacks(new CommandCallbacks());

  _statusChar = service->createCharacteristic(
    STATUS_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY
  );

  service->start();
  NimBLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  NimBLEDevice::getAdvertising()->start();
  Serial.println("[BLE] Advertising as " BLE_DEVICE_NAME);
}

bool BLEManager::isConnected() const {
  return _server && _server->getConnectedCount() > 0;
}

void BLEManager::sendStatus(bool failsafeActive) {
  if (!_statusChar || !_controller) return;

  uint8_t flags = 0x01;
  if (failsafeActive) flags |= 0x02;
  if (_controller->isHomingComplete()) flags |= 0x04;
  if (_controller->isAnyMoving()) flags |= 0x08;

  uint8_t payload[STATUS_PACKET_SIZE] = {0};
  payload[0] = STATUS_HEADER;
  payload[1] = flags;
  payload[2] = 0x00;
  payload[3] = 0x00;
  for (int i = 0; i < NUM_MODULES; i++) {
    payload[4 + i] = _controller->getCurrentPosition(i);
  }

  _statusChar->setValue(payload, STATUS_PACKET_SIZE);
  _statusChar->notify();
}
