#pragma once
#include <NimBLEDevice.h>
#include "config.h"
#include "protocol.h"
#include "motor_controller.h"

class BLEManager {
public:
  void begin(MotorController* controller);
  void sendStatus(bool failsafeActive, uint16_t batteryMv = 0);
  unsigned long lastValidPacketMs() const { return _lastPacketMs; }
  bool isConnected() const;

  MotorController* _controller = nullptr;

private:
  NimBLECharacteristic* _statusChar = nullptr;
  NimBLEServer* _server = nullptr;
  unsigned long _lastPacketMs = 0;
};

extern BLEManager bleManager;
