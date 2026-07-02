#pragma once
#include <NimBLEDevice.h>
#include "config.h"
#include "protocol.h"
#include "servo_controller.h"

class BLEManager {
public:
  void begin(ServoController* sc);
  void sendStatus(uint16_t batteryMv, bool failsafeActive);
  unsigned long lastValidPacketMs() const { return _lastPacketMs; }
  bool isConnected() const;

  ServoController* _sc = nullptr;          // public for callback access

private:
  NimBLECharacteristic* _statusChar = nullptr;
  NimBLEServer* _server = nullptr;
  unsigned long _lastPacketMs = 0;
};

extern BLEManager bleManager;
