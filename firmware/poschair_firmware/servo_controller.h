#pragma once
#include <Adafruit_PWMServoDriver.h>
#include "config.h"

class ServoController {
public:
  void begin();
  void setTarget(int idx, uint8_t angleDeg);   // clamps to MAX_SAFE_ANGLE
  void update();                                 // call every loop(); eases toward target
  uint8_t getCurrentAngle(int idx) const;
  void goNeutralAll();                           // set all targets to NEUTRAL_ANGLE

private:
  Adafruit_PWMServoDriver _pwm;
  uint8_t _current[NUM_SERVOS];
  uint8_t _target[NUM_SERVOS];
  unsigned long _lastUpdateMs = 0;
  void _writePulse(int idx, uint8_t angleDeg);
};
