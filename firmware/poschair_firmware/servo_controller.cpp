#include "servo_controller.h"

ServoController::ServoController() : _pwm(PCA9685_ADDR) {
    for (int i = 0; i < NUM_SERVOS; i++) {
        _current_angles[i] = SERVO_NEUTRAL_ANGLE;
        _target_angles[i] = SERVO_NEUTRAL_ANGLE;
    }
}

bool ServoController::begin() {
    _pwm.begin();
    _pwm.setOscillatorFrequency(27000000); // Standard PCA9685 internal oscillator is 27MHz
    _pwm.setPWMFreq(SERVO_FREQ);
    delay(10); // Wait for oscillator stabilization
    
    // Command all servos to neutral state on startup
    resetToNeutral();
    return true;
}

void ServoController::setTargetAngles(const uint8_t angles[NUM_SERVOS]) {
    for (int i = 0; i < NUM_SERVOS; i++) {
        setTargetAngle(i, angles[i]);
    }
}

void ServoController::setTargetAngle(uint8_t index, uint8_t angle) {
    if (index >= NUM_SERVOS) return;
    
    // Clamp angle to safe operational boundaries
    if (angle < SERVO_MIN_SAFE_ANGLE) {
        _target_angles[index] = SERVO_MIN_SAFE_ANGLE;
    } else if (angle > SERVO_MAX_SAFE_ANGLE) {
        _target_angles[index] = SERVO_MAX_SAFE_ANGLE;
    } else {
        _target_angles[index] = angle;
    }
}

void ServoController::update() {
    for (int i = 0; i < NUM_SERVOS; i++) {
        float diff = _target_angles[i] - _current_angles[i];
        
        if (abs(diff) > 0.01f) {
            // Apply simple linear interpolation easing to prevent snappy movement
            if (abs(diff) <= SERVO_INTERPOLATION_STEP) {
                _current_angles[i] = _target_angles[i];
            } else {
                if (diff > 0) {
                    _current_angles[i] += SERVO_INTERPOLATION_STEP;
                } else {
                    _current_angles[i] -= SERVO_INTERPOLATION_STEP;
                }
            }
            writeAngleToPCA(i, _current_angles[i]);
        }
    }
}

void ServoController::resetToNeutral() {
    for (int i = 0; i < NUM_SERVOS; i++) {
        _target_angles[i] = SERVO_NEUTRAL_ANGLE;
    }
    // Instantly set current angles to neutral for instant recovery/failsafe
    for (int i = 0; i < NUM_SERVOS; i++) {
        _current_angles[i] = SERVO_NEUTRAL_ANGLE;
        writeAngleToPCA(i, SERVO_NEUTRAL_ANGLE);
    }
}

void ServoController::getCurrentAngles(uint8_t out_angles[NUM_SERVOS]) const {
    for (int i = 0; i < NUM_SERVOS; i++) {
        out_angles[i] = (uint8_t)round(_current_angles[i]);
    }
}

void ServoController::getTargetAngles(uint8_t out_angles[NUM_SERVOS]) const {
    for (int i = 0; i < NUM_SERVOS; i++) {
        out_angles[i] = _target_angles[i];
    }
}

void ServoController::writeAngleToPCA(uint8_t channel, float angle) {
    // Map the 0-180 range to the pulse width duration in microseconds
    float constrained_angle = constrain(angle, 0.0f, 180.0f);
    uint16_t pulse_us = map(constrained_angle, 0.0f, 180.0f, USMIN, USMAX);
    _pwm.writeMicroseconds(channel, pulse_us);
}
