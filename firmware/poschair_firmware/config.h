#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// I2C pins for ESP32-C3 Mini / SuperMini
#define I2C_SDA 8
#define I2C_SCL 9

// BLE Configuration
#define DEVICE_NAME "POSCHAIR_001"
#define SERVICE_UUID           "a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e"
#define CHARACTERISTIC_UUID_RX "a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e" // Command characteristic (Write)
#define CHARACTERISTIC_UUID_TX "a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e" // Status characteristic (Notify)

// Servo and PCA9685 Configuration
#define PCA9685_ADDR 0x40
#define SERVO_FREQ 50
#define NUM_SERVOS 6

// Servo hardware calibration (pulse widths in microseconds for 0 to 180 deg)
#define USMIN 500  // Minimum pulse width (typically 500 us)
#define USMAX 2500 // Maximum pulse width (typically 2500 us)

// Angle safety boundaries
#define SERVO_MIN_SAFE_ANGLE 10
#define SERVO_MAX_SAFE_ANGLE 170
#define SERVO_NEUTRAL_ANGLE 90 // Default state (flat/relaxed bow)

// Timing constraints
#define FAILSAFE_TIMEOUT_MS 2000 // 2 seconds without command returning to neutral
#define STATUS_INTERVAL_MS 1000  // 1 second status updates
#define CONTROL_LOOP_DELAY_MS 20 // 50 Hz control updates

// Interpolation (easing) settings
// Higher values = faster movements, lower values = smoother, gentler movements
#define SERVO_INTERPOLATION_STEP 1.5f 

// Battery Voltage Reading Pin and Settings
// GPIO 3 is ADC1_CH3 on ESP32-C3
#define BATTERY_ADC_PIN 3 
#define ADC_REF_VOLTAGE 3.3f
#define ADC_RESOLUTION 4095.0f
// Resistor divider calibration factor (2.0 if using equal 10k resistors divider)
#define BATTERY_VOLTAGE_MULTIPLIER 2.0f 

#endif // CONFIG_H
