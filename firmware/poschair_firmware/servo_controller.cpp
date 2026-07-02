#include "servo_controller.h"

void ServoController::begin() {
  _pwm.begin();
  _pwm.setPWMFreq(50);
  for (int i = 0; i < NUM_SERVOS; i++) {
    _current[i] = NEUTRAL_ANGLE;
    _target[i]  = NEUTRAL_ANGLE;
    _writePulse(i, NEUTRAL_ANGLE);
  }
  delay(500);
  Serial.println("[Servo] All 6 channels initialised to neutral");
}

void ServoController::setTarget(int idx, uint8_t angleDeg) {
  if (idx < 0 || idx >= NUM_SERVOS) return;
  if (angleDeg > MAX_SAFE_ANGLE) angleDeg = MAX_SAFE_ANGLE;  // hard clamp, always
  _target[idx] = angleDeg;
}

void ServoController::update() {
  unsigned long now = millis();
  if (now - _lastUpdateMs < SERVO_UPDATE_MS) return;
  _lastUpdateMs = now;

  for (int i = 0; i < NUM_SERVOS; i++) {
    if (_current[i] < _target[i])
      _current[i] = min((int)_target[i], (int)_current[i] + SERVO_STEP_DEG);
    else if (_current[i] > _target[i])
      _current[i] = max((int)_target[i], (int)_current[i] - SERVO_STEP_DEG);
    _writePulse(i, _current[i]);
  }
}

uint8_t ServoController::getCurrentAngle(int idx) const {
  if (idx < 0 || idx >= NUM_SERVOS) return 0;
  return _current[idx];
}

void ServoController::goNeutralAll() {
  for (int i = 0; i < NUM_SERVOS; i++) setTarget(i, NEUTRAL_ANGLE);
}

void ServoController::_writePulse(int idx, uint8_t angleDeg) {
  int pulse = map(angleDeg, 0, 180, SERVO_MIN_PULSE, SERVO_MAX_PULSE);
  _pwm.writeMicroseconds(idx, pulse);
}

void ServoController::playStartupAnimation() {
  Serial.println("[Servo] Running startup grid wave animation...");
  
  // Helper to wait until all current angles reach targets
  auto waitUntilTargetReached = [this](int stepDelayMs) {
    bool moving = true;
    while (moving) {
      moving = false;
      for (int i = 0; i < NUM_SERVOS; i++) {
        if (_current[i] < _target[i]) {
          _current[i] = min((int)_target[i], (int)_current[i] + 2); // 2 degree steps
          _writePulse(i, _current[i]);
          moving = true;
        } else if (_current[i] > _target[i]) {
          _current[i] = max((int)_target[i], (int)_current[i] - 2);
          _writePulse(i, _current[i]);
          moving = true;
        }
      }
      delay(stepDelayMs);
    }
  };

  // Wave 1: Top Row -> Mid Row -> Lower Row
  // Row 1 (UL/UR) out to 30
  setTarget(0, 30); setTarget(1, 30);
  waitUntilTargetReached(15);
  delay(150);

  // Row 1 neutral, Row 2 (ML/MR) out to 30
  setTarget(0, 0); setTarget(1, 0);
  setTarget(2, 30); setTarget(3, 30);
  waitUntilTargetReached(15);
  delay(150);

  // Row 2 neutral, Row 3 (LL/LR) out to 30
  setTarget(2, 0); setTarget(3, 0);
  setTarget(4, 30); setTarget(5, 30);
  waitUntilTargetReached(15);
  delay(150);

  // Row 3 neutral
  setTarget(4, 0); setTarget(5, 0);
  waitUntilTargetReached(15);
  delay(300);

  // Wave 2: Left Column -> Right Column
  // Left Column (UL/ML/LL) out to 30
  setTarget(0, 30); setTarget(2, 30); setTarget(4, 30);
  waitUntilTargetReached(15);
  delay(250);

  // Left Column neutral, Right Column (UR/MR/LR) out to 30
  setTarget(0, 0); setTarget(2, 0); setTarget(4, 0);
  setTarget(1, 30); setTarget(3, 30); setTarget(5, 30);
  waitUntilTargetReached(15);
  delay(250);

  // Right Column neutral
  setTarget(1, 0); setTarget(3, 0); setTarget(5, 0);
  waitUntilTargetReached(15);
  
  Serial.println("[Servo] Startup animation complete.");
}
