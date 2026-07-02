#ifndef SERVO_CONTROLLER_H
#define SERVO_CONTROLLER_H

#include <Arduino.h>
#include <Adafruit_PWMServoDriver.h>
#include "config.h"

class ServoController {
public:
    ServoController();
    
    // Initialize the PCA9685 board
    bool begin();
    
    // Set target angles for all 6 servos (clamped to safe limits)
    void setTargetAngles(const uint8_t angles[NUM_SERVOS]);
    
    // Set a single servo's target angle
    void setTargetAngle(uint8_t index, uint8_t angle);
    
    // Update interpolation (runs inside control loop)
    void update();
    
    // Instantly command all servos to the neutral angle
    void resetToNeutral();
    
    // Retrieve current angles
    void getCurrentAngles(uint8_t out_angles[NUM_SERVOS]) const;
    
    // Retrieve target angles
    void getTargetAngles(uint8_t out_angles[NUM_SERVOS]) const;

private:
    Adafruit_PWMServoDriver _pwm;
    float _current_angles[NUM_SERVOS];
    uint8_t _target_angles[NUM_SERVOS];
    
    // Helper to write an angle to a PCA9685 pin
    void writeAngleToPCA(uint8_t channel, float angle);
};

#endif // SERVO_CONTROLLER_H
