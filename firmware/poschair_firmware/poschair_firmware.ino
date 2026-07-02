// PosChair Firmware — ESP32-C3 Mini
// Arduino IDE: ESP32C3 Dev Module, USB CDC On Boot: Enabled
// Libraries: NimBLE-Arduino, Adafruit PWM Servo Driver

#include <Wire.h>
#include "config.h"
#include "protocol.h"
#include "servo_controller.h"
#include "ble_manager.h"

ServoController servos;
unsigned long lastStatusMs   = 0;
bool failsafeActive          = false;

uint16_t readBatteryMv() {
  int raw = analogRead(BATTERY_ADC_PIN);
  return (uint16_t)((raw / (float)BATTERY_ADC_MAX) * BATTERY_REF_MV * BATTERY_DIVIDER);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== PosChair Firmware Starting ===");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  servos.begin();
  bleManager.begin(&servos);

  Serial.println("Ready.");
}

void loop() {
  servos.update();

  // Safety failsafe
  bool timedOut = (millis() - bleManager.lastValidPacketMs() > FAILSAFE_TIMEOUT_MS);
  if (timedOut && !failsafeActive) {
    Serial.println("WARNING: BLE timeout — returning to neutral");
    failsafeActive = true;
  }
  if (timedOut) servos.goNeutralAll();
  if (!timedOut) failsafeActive = false;

  // Status notify
  if (millis() - lastStatusMs > STATUS_INTERVAL_MS) {
    lastStatusMs = millis();
    bleManager.sendStatus(readBatteryMv(), failsafeActive);
  }
}
