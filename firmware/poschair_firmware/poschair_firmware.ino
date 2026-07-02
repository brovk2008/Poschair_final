// PosChair Firmware v2 — ESP32-C3 Mini
// 6 servos in 2×3 grid (UL, UR, ML, MR, LL, LR)
// Pre-curved 65Mn spring steel strips, direct horn winding
//
// Board: ESP32C3 Dev Module
// USB CDC On Boot: Enabled
// Libraries: NimBLE-Arduino, Adafruit PWM Servo Driver

#include <Wire.h>
#include "config.h"
#include "protocol.h"
#include "servo_controller.h"
#include "ble_manager.h"

ServoController servos;
unsigned long lastStatusMs = 0;
bool failsafeActive = false;

uint16_t readBatteryMv() {
  int raw = analogRead(BATTERY_ADC_PIN);
  return (uint16_t)((raw / (float)BATTERY_ADC_MAX) * BATTERY_REF_MV * BATTERY_DIVIDER);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== PosChair v2 Firmware Starting ===");
  Serial.println("Layout: UL=CH0 UR=CH1 ML=CH2 MR=CH3 LL=CH4 LR=CH5");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  servos.begin();
  bleManager.begin(&servos);

  Serial.println("Ready. All modules at neutral (pre-curve resting position).");
}

void loop() {
  servos.update();

  // Safety failsafe: BLE silent for >2s → return all to neutral
  bool timedOut = (millis() - bleManager.lastValidPacketMs() > FAILSAFE_TIMEOUT_MS);
  if (timedOut && !failsafeActive) {
    Serial.println("WARNING: Failsafe triggered — all modules returning to neutral");
    failsafeActive = true;
  }
  if (timedOut)  servos.goNeutralAll();
  if (!timedOut) failsafeActive = false;

  // Periodic status notify
  if (millis() - lastStatusMs > STATUS_INTERVAL_MS) {
    lastStatusMs = millis();
    bleManager.sendStatus(readBatteryMv(), failsafeActive);

    // Debug print
    Serial.printf("[Status] UL=%d UR=%d ML=%d MR=%d LL=%d LR=%d bat=%dmV fs=%d\n",
      servos.getCurrentAngle(0), servos.getCurrentAngle(1),
      servos.getCurrentAngle(2), servos.getCurrentAngle(3),
      servos.getCurrentAngle(4), servos.getCurrentAngle(5),
      readBatteryMv(), failsafeActive);
  }
}
