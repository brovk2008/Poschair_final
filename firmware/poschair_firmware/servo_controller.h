#pragma once
#include <Adafruit_PWMServoDriver.h>
#include "config.h"

class ServoController {
public:
  void begin();
  void setTarget(int idx, uint8_t angleDeg);  // idx: 0=UL,1=UR,2=ML,3=MR,4=LL,5=LR
  void update();                               // call every loop() — eases toward target
  uint8_t getCurrentAngle(int idx) const;
  void goNeutralAll();

private:
  Adafruit_PWMServoDriver _pwm;
  uint8_t _current[NUM_SERVOS];
  uint8_t _target[NUM_SERVOS];
  unsigned long _lastUpdateMs = 0;
  void _writePulse(int idx, uint8_t angleDeg);
};
