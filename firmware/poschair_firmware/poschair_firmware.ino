#include <Arduino.h>
#include <Wire.h>
#include "config.h"
#include "protocol.h"
#include "servo_controller.h"
#include "ble_manager.h"

ServoController servo_ctrl;
BLEManager ble_manager(servo_ctrl);

uint32_t last_status_time = 0;
bool failsafe_active = false;

// Actual battery voltage reading via ESP32-C3 ADC channel
uint16_t read_battery_voltage() {
    // Read raw ADC channel value
    int adc_raw = analogRead(BATTERY_ADC_PIN);
    
    // Calculate reference-relative voltage on the pin
    float v_adc = ((float)adc_raw / ADC_RESOLUTION) * ADC_REF_VOLTAGE;
    
    // Account for external voltage divider scale
    float v_battery = v_adc * BATTERY_VOLTAGE_MULTIPLIER;
    
    // Convert float value to millivolts uint16
    return (uint16_t)(v_battery * 1000.0f);
}

void setup() {
    // Enable serial interface for debugging
    Serial.begin(115200);
    delay(1000);
    Serial.println("--- PosChair Firmware Starting (Arduino IDE Mode) ---");

    // Initialize I2C interface
    Wire.begin(I2C_SDA, I2C_SCL);
    Serial.printf("I2C initialized Scl/Sda on GPIO pins [%d, %d]\n", I2C_SDA, I2C_SCL);

    // Set ADC parameters for battery reading
    analogReadResolution(12); // ESP32-C3 standard 12-bit resolution

    // Initialize Servo Controller (PCA9685)
    if (!servo_ctrl.begin()) {
        Serial.println("ERROR: Failed to initialize servo controller!");
    } else {
        Serial.println("Servo controller initialized successfully.");
    }

    // Initialize BLE Manager (NimBLE)
    if (!ble_manager.begin()) {
        Serial.println("ERROR: Failed to initialize BLE manager!");
    } else {
        Serial.println("BLE manager initialized successfully.");
    }

    last_status_time = millis();
    Serial.println("--- Setup Complete, starting control loop ---");
}

void loop() {
    // 1. Process servo easing interpolation
    servo_ctrl.update();

    // 2. Check BLE Connection and command timeout watchdogs
    if (ble_manager.isConnected()) {
        // If a command hasn't been received in FAILSAFE_TIMEOUT_MS, trigger failsafe
        if (ble_manager.msSinceLastCommand() > FAILSAFE_TIMEOUT_MS) {
            if (!failsafe_active) {
                failsafe_active = true;
                Serial.println("WARNING: Watchdog timeout! Reverting to neutral posture.");
                servo_ctrl.resetToNeutral();
            }
        } else {
            failsafe_active = false;
        }
    } else {
        // No client connected, force neutral position
        if (!failsafe_active) {
            failsafe_active = true;
            Serial.println("No client connected. Forcing neutral position.");
            servo_ctrl.resetToNeutral();
        }
    }

    // 3. Periodic Status Notification
    uint32_t current_time = millis();
    if (current_time - last_status_time >= STATUS_INTERVAL_MS) {
        last_status_time = current_time;

        // Build status packet
        StatusPacket status;
        status.header = STATUS_HEADER;
        
        status.status_flags = 0;
        if (ble_manager.isConnected()) {
            status.status_flags |= 0x01; // Bit 0: BLE Connected
        }
        if (failsafe_active) {
            status.status_flags |= 0x02; // Bit 1: Failsafe Active
        }
        
        // Read battery and serialize in Big-Endian format
        uint16_t battery_mv = read_battery_voltage();
        status.battery_msb = (battery_mv >> 8) & 0xFF;
        status.battery_lsb = battery_mv & 0xFF;
        
        servo_ctrl.getCurrentAngles(status.current_angles);

        // Notify client
        ble_manager.notifyStatus(status);

        if (ble_manager.isConnected()) {
            Serial.printf("Status sent. Battery: %dmV, Current angles: [%d, %d, %d, %d, %d, %d], Failsafe: %d\n",
                          battery_mv,
                          status.current_angles[0], status.current_angles[1], status.current_angles[2],
                          status.current_angles[3], status.current_angles[4], status.current_angles[5],
                          failsafe_active);
        }
    }

    // Small delay to regulate control loop frequency (50Hz updates)
    delay(CONTROL_LOOP_DELAY_MS);
}
