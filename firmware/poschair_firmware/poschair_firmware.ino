// PosChair Firmware v3 - ESP32-C3 Mini
// 6 custom worm-rack actuators in 2x3 paraspinal grid.
// Drivers: 6x BTS7960 H-bridges, one DC geared motor per module.
//
// Board: ESP32C3 Dev Module
// USB CDC On Boot: Enabled
// Library: NimBLE-Arduino

#include "config.h"
#include "protocol.h"
#include "motor_controller.h"
#include "ble_manager.h"

MotorController motors;
unsigned long lastStatusMs = 0;
bool failsafeActive = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== PosChair v3 Firmware Starting ===");
  Serial.println("Layout: UL=M0 UR=M1 ML=M2 MR=M3 LL=M4 LR=M5");
  Serial.println("Actuator: BTS7960 + DC motor + worm-rack timed position control");

  motors.begin();
  motors.homeAll();
  bleManager.begin(&motors);

  Serial.println("Ready. Positions are 0-100mm. Advertising as " BLE_DEVICE_NAME ".");
}

void loop() {
  motors.update();

  const bool timedOut = (millis() - bleManager.lastValidPacketMs() > FAILSAFE_TIMEOUT_MS);
  if (timedOut && !failsafeActive) {
    Serial.println("WARNING: BLE timeout - retracting all modules to 0mm");
    failsafeActive = true;
    for (int i = 0; i < NUM_MODULES; i++) motors.setTarget(i, 0);
  }
  if (!timedOut) failsafeActive = false;

  if (millis() - lastStatusMs > STATUS_INTERVAL_MS) {
    lastStatusMs = millis();
    bleManager.sendStatus(failsafeActive);

    Serial.printf("[Status] UL=%d UR=%d ML=%d MR=%d LL=%d LR=%d homed=%d moving=%d fs=%d\n",
      motors.getCurrentPosition(0), motors.getCurrentPosition(1),
      motors.getCurrentPosition(2), motors.getCurrentPosition(3),
      motors.getCurrentPosition(4), motors.getCurrentPosition(5),
      motors.isHomingComplete(), motors.isAnyMoving(), failsafeActive);
  }
}
