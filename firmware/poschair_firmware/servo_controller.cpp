#include "servo_controller.h"

void ServoController::begin() {
  _pwm.begin();
  _pwm.setPWMFreq(50);
  for (int i = 0; i < NUM_SERVOS; i++) {
    _current[i] = NEUTRAL_ANGLE;
    _target[i]  = NEUTRAL_ANGLE;
    _writePulse(i, NEUTRAL_ANGLE);
  }
  delay(500); // let servos reach neutral before anything else
}

void ServoController::setTarget(int idx, uint8_t angleDeg) {
  if (idx < 0 || idx >= NUM_SERVOS) return;
  if (angleDeg > MAX_SAFE_ANGLE) angleDeg = MAX_SAFE_ANGLE;
  _target[idx] = angleDeg;
}

void ServoController::update() {
  unsigned long now = millis();
  if (now - _lastUpdateMs < SERVO_UPDATE_MS) return;
  _lastUpdateMs = now;

  for (int i = 0; i < NUM_SERVOS; i++) {
    if (_current[i] < _target[i]) {
      _current[i] = min((int)_target[i], (int)_current[i] + SERVO_STEP_DEG);
    } else if (_current[i] > _target[i]) {
      _current[i] = max((int)_target[i], (int)_current[i] - SERVO_STEP_DEG);
    }
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
