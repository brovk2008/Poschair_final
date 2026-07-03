#include "motor_controller.h"

void MotorController::begin() {
  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  for (int i = 0; i < NUM_MODULES; i++) {
    ledcAttach(RPWM_PINS[i], MOTOR_PWM_FREQ, MOTOR_PWM_RES);
    ledcAttach(LPWM_PINS[i], MOTOR_PWM_FREQ, MOTOR_PWM_RES);
    _stop(i);
    _currentPos[i] = 0;
    _targetPos[i] = 0;
    _state[i] = MotorState::IDLE;
  }

  Serial.println("[Motor] BTS7960 outputs initialised.");
}

void MotorController::homeAll() {
  Serial.println("[Motor] Homing all modules to fully retracted position...");
  _homingDone = false;

  for (int i = 0; i < NUM_MODULES; i++) {
    _state[i] = MotorState::HOMING;
    _driveIn(i, MOTOR_PWM_HOMING);
  }

  delay(HOMING_TIMEOUT_MS);

  for (int i = 0; i < NUM_MODULES; i++) {
    _brake(i);
  }
  delay(HOMING_EXTRA_MS);

  for (int i = 0; i < NUM_MODULES; i++) {
    _stop(i);
    _currentPos[i] = 0;
    _targetPos[i] = 0;
    _state[i] = MotorState::IDLE;
  }

  _homingDone = true;
  Serial.println("[Motor] Homing complete. All positions zeroed.");
}

void MotorController::setTarget(int idx, uint8_t position) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  if (position > MAX_POSITION_MM) position = MAX_POSITION_MM;

  if (abs((int)position - (int)_targetPos[idx]) < MIN_POSITION_CHANGE) return;

  _targetPos[idx] = position;
  _moveDurationMs[idx] = _durationForDelta(_currentPos[idx], _targetPos[idx]);
  _moveStartMs[idx] = millis();

  if (_moveDurationMs[idx] == 0 || _currentPos[idx] == _targetPos[idx]) {
    _stop(idx);
    _currentPos[idx] = _targetPos[idx];
    _state[idx] = MotorState::IDLE;
    return;
  }

  if (_targetPos[idx] > _currentPos[idx]) {
    _state[idx] = MotorState::MOVING_OUT;
    _driveOut(idx, MOTOR_PWM_NORMAL);
  } else {
    _state[idx] = MotorState::MOVING_IN;
    _driveIn(idx, MOTOR_PWM_NORMAL);
  }
}

void MotorController::update() {
  const unsigned long now = millis();

  for (int i = 0; i < NUM_MODULES; i++) {
    if (_state[i] != MotorState::MOVING_OUT && _state[i] != MotorState::MOVING_IN) continue;

    const unsigned long elapsed = now - _moveStartMs[i];
    if (elapsed >= _moveDurationMs[i]) {
      _stop(i);
      _currentPos[i] = _targetPos[i];
      _state[i] = MotorState::IDLE;
    }
  }
}

uint8_t MotorController::getCurrentPosition(int idx) const {
  if (idx < 0 || idx >= NUM_MODULES) return 0;
  return _currentPos[idx];
}

bool MotorController::isAnyMoving() const {
  for (int i = 0; i < NUM_MODULES; i++) {
    if (_state[i] != MotorState::IDLE) return true;
  }
  return false;
}

void MotorController::stopAll() {
  for (int i = 0; i < NUM_MODULES; i++) {
    _stop(i);
    _targetPos[i] = _currentPos[i];
    _state[i] = MotorState::IDLE;
  }
}

void MotorController::_driveOut(int idx, uint8_t pwm) {
  ledcWrite(RPWM_PINS[idx], pwm);
  ledcWrite(LPWM_PINS[idx], 0);
}

void MotorController::_driveIn(int idx, uint8_t pwm) {
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], pwm);
}

void MotorController::_stop(int idx) {
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], 0);
}

void MotorController::_brake(int idx) {
  ledcWrite(RPWM_PINS[idx], 255);
  ledcWrite(LPWM_PINS[idx], 255);
}

unsigned long MotorController::_durationForDelta(uint8_t fromPos, uint8_t toPos) const {
  const float deltaMm = abs((int)toPos - (int)fromPos) * POSITION_UNIT_TO_MM;
  if (MOTOR_SPEED_MM_PER_MS <= 0.0f) return 0;
  return (unsigned long)(deltaMm / MOTOR_SPEED_MM_PER_MS);
}
