// PosChair v3 Motor Test - no BLE
// Flash this first to verify BTS7960 wiring and measure travel speed.
// Each module extends for 2000ms, brakes, retracts for 2000ms, then stops.

#include <Arduino.h>

#define NUM_MODULES 6

const uint8_t RPWM_PINS[NUM_MODULES] = {25, 27, 14, 17, 21, 23};
const uint8_t LPWM_PINS[NUM_MODULES] = {26, 16, 13, 18, 22, 19};

#define EN_PIN 5
#define PWM_FREQ 5000
#define PWM_RES 8
#define TEST_PWM 200
#define TEST_RUN_MS 2000
#define BRAKE_MS 200

const char* LABELS[NUM_MODULES] = {
  "M0 Upper-Left",
  "M1 Upper-Right",
  "M2 Mid-Left",
  "M3 Mid-Right",
  "M4 Lower-Left",
  "M5 Lower-Right"
};

void driveOut(int idx, uint8_t pwm) {
  ledcWrite(RPWM_PINS[idx], pwm);
  ledcWrite(LPWM_PINS[idx], 0);
}

void driveIn(int idx, uint8_t pwm) {
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], pwm);
}

void stopMotor(int idx) {
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], 0);
}

void brakeMotor(int idx) {
  ledcWrite(RPWM_PINS[idx], 255);
  ledcWrite(LPWM_PINS[idx], 255);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  for (int i = 0; i < NUM_MODULES; i++) {
    ledcAttach(RPWM_PINS[i], PWM_FREQ, PWM_RES);
    ledcAttach(LPWM_PINS[i], PWM_FREQ, PWM_RES);
    stopMotor(i);
  }

  Serial.println("PosChair v3 motor test.");
  Serial.println("Measure extension distance during each 2000ms OUT run.");
  Serial.println("MOTOR_SPEED_MM_PER_MS = measured_mm / 2000.0");
}

void loop() {
  for (int i = 0; i < NUM_MODULES; i++) {
    Serial.printf("Testing %s: OUT for %dms\n", LABELS[i], TEST_RUN_MS);
    driveOut(i, TEST_PWM);
    delay(TEST_RUN_MS);
    brakeMotor(i);
    delay(BRAKE_MS);

    Serial.printf("Testing %s: IN for %dms\n", LABELS[i], TEST_RUN_MS);
    driveIn(i, TEST_PWM);
    delay(TEST_RUN_MS);
    brakeMotor(i);
    delay(BRAKE_MS);
    stopMotor(i);
    delay(700);
  }

  Serial.println("One full motor test cycle done. Repeating...");
  delay(1500);
}
