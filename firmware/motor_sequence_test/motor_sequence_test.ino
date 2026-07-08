// PosChair V3 Automatic Motor Sequence Test
// Board: DOIT ESP32 DEVKIT V1 / ESP32 Dev Module
//
// This sketch runs all six motors in repeatable wiring-test patterns:
//   1. one motor at a time
//   2. two motors at a time
//   3. three motors at a time
//   4. all six motors at once
//
// Motor note:
//   Your motor speed is 10 RPM, but this test is intentionally time-based.
//   10 RPM describes shaft rotation speed; actual linear actuator travel also
//   depends on worm/rack pitch and load. Use this sketch to confirm wiring and
//   direction, then measure travel separately for MOTOR_SPEED_MM_PER_MS.

#include <Arduino.h>

#define NUM_MODULES 6

// ESP32 DevKit V1 -> BTS7960 pin map.
const uint8_t RPWM_PINS[NUM_MODULES] = {25, 27, 14, 17, 21, 23};
const uint8_t LPWM_PINS[NUM_MODULES] = {26, 16, 13, 18, 22, 19};

#define EN_PIN 5

#define PWM_FREQ 5000
#define PWM_RES 8

// Keep this conservative for first bench tests.
#define TEST_PWM 180
#define RUN_MS 1200
#define PAUSE_MS 700
#define BRAKE_MS 120

const char* LABELS[NUM_MODULES] = {
  "M0 Upper-Left",
  "M1 Upper-Right",
  "M2 Mid-Left",
  "M3 Mid-Right",
  "M4 Lower-Left",
  "M5 Lower-Right"
};

const int PAIRS[][2] = {
  {0, 1}, // upper row
  {2, 3}, // middle row
  {4, 5}, // lower row
  {0, 2}, // left upper/mid
  {1, 3}, // right upper/mid
  {2, 4}, // left mid/lower
  {3, 5}, // right mid/lower
};

const int TRIPLES[][3] = {
  {0, 2, 4}, // left column
  {1, 3, 5}, // right column
  {0, 1, 2}, // first three modules
  {3, 4, 5}, // last three modules
};

void driveOut(int idx, uint8_t pwm = TEST_PWM) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], pwm);
  ledcWrite(LPWM_PINS[idx], 0);
}

void driveIn(int idx, uint8_t pwm = TEST_PWM) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], pwm);
}

void stopMotor(int idx) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], 0);
}

void brakeMotor(int idx) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], 255);
  ledcWrite(LPWM_PINS[idx], 255);
}

void stopAll() {
  for (int i = 0; i < NUM_MODULES; i++) stopMotor(i);
}

void brakeAllBriefly() {
  for (int i = 0; i < NUM_MODULES; i++) brakeMotor(i);
  delay(BRAKE_MS);
  stopAll();
}

void printPinMap() {
  Serial.println();
  Serial.println("Pin map:");
  Serial.println("GPIO5 -> all BTS7960 R_EN + L_EN");
  for (int i = 0; i < NUM_MODULES; i++) {
    Serial.printf("%s: RPWM=GPIO%d LPWM=GPIO%d\n", LABELS[i], RPWM_PINS[i], LPWM_PINS[i]);
  }
  Serial.println();
}

void runGroupOut(const int* group, int count, const char* label) {
  Serial.printf("OUT: %s\n", label);
  for (int i = 0; i < count; i++) {
    Serial.printf("  %s\n", LABELS[group[i]]);
    driveOut(group[i]);
  }
  delay(RUN_MS);
  brakeAllBriefly();
}

void runGroupIn(const int* group, int count, const char* label) {
  Serial.printf("IN: %s\n", label);
  for (int i = 0; i < count; i++) {
    Serial.printf("  %s\n", LABELS[group[i]]);
    driveIn(group[i]);
  }
  delay(RUN_MS);
  brakeAllBriefly();
}

void cycleGroup(const int* group, int count, const char* label) {
  runGroupOut(group, count, label);
  delay(PAUSE_MS);
  runGroupIn(group, count, label);
  delay(PAUSE_MS);
}

void testOneAtATime() {
  Serial.println();
  Serial.println("=== Test 1: one motor at a time ===");
  for (int i = 0; i < NUM_MODULES; i++) {
    int group[] = {i};
    cycleGroup(group, 1, LABELS[i]);
  }
}

void testTwoAtATime() {
  Serial.println();
  Serial.println("=== Test 2: two motors at a time ===");
  for (unsigned int i = 0; i < sizeof(PAIRS) / sizeof(PAIRS[0]); i++) {
    char label[40];
    snprintf(label, sizeof(label), "M%d + M%d", PAIRS[i][0], PAIRS[i][1]);
    cycleGroup(PAIRS[i], 2, label);
  }
}

void testThreeAtATime() {
  Serial.println();
  Serial.println("=== Test 3: three motors at a time ===");
  for (unsigned int i = 0; i < sizeof(TRIPLES) / sizeof(TRIPLES[0]); i++) {
    char label[48];
    snprintf(label, sizeof(label), "M%d + M%d + M%d", TRIPLES[i][0], TRIPLES[i][1], TRIPLES[i][2]);
    cycleGroup(TRIPLES[i], 3, label);
  }
}

void testAllAtOnce() {
  Serial.println();
  Serial.println("=== Test 4: all six motors at once ===");
  const int allModules[] = {0, 1, 2, 3, 4, 5};
  cycleGroup(allModules, 6, "M0 + M1 + M2 + M3 + M4 + M5");
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  for (int i = 0; i < NUM_MODULES; i++) {
    ledcAttach(RPWM_PINS[i], PWM_FREQ, PWM_RES);
    ledcAttach(LPWM_PINS[i], PWM_FREQ, PWM_RES);
    stopMotor(i);
  }

  Serial.println();
  Serial.println("=== PosChair V3 Automatic Motor Sequence Test ===");
  Serial.println("Motor speed note: motor is 10 RPM, but this test uses timed PWM pulses.");
  Serial.println("If a motor direction is reversed, swap that BTS7960 M+ and M- output.");
  printPinMap();
  delay(2000);
}

void loop() {
  testOneAtATime();
  testTwoAtATime();
  testThreeAtATime();
  testAllAtOnce();

  Serial.println();
  Serial.println("Sequence complete. Repeating in 5 seconds...");
  stopAll();
  delay(5000);
}
