// PosChair Servo Sweep Test — no BLE
// Flash this first to confirm PCA9685 wiring and all 6 channels.
// Expected: each servo sweeps 0° → 40° → 0° in sequence, one at a time.
// If a servo doesn't move, check its PCA9685 channel wiring.

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#define SDA_PIN    8
#define SCL_PIN    9
#define NUM_SERVOS 6
#define MIN_PULSE  500
#define MAX_PULSE  2500

// Channel label map — matches firmware
const char* LABELS[] = {
  "CH0 Upper-Left",
  "CH1 Upper-Right",
  "CH2 Mid-Left",
  "CH3 Mid-Right",
  "CH4 Lower-Left",
  "CH5 Lower-Right"
};

Adafruit_PWMServoDriver pwm;

void writeAngle(int ch, int deg) {
  pwm.writeMicroseconds(ch, map(deg, 0, 180, MIN_PULSE, MAX_PULSE));
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(SDA_PIN, SCL_PIN);
  pwm.begin();
  pwm.setPWMFreq(50);
  // Move all to neutral first
  for (int i = 0; i < NUM_SERVOS; i++) writeAngle(i, 0);
  delay(1000);
  Serial.println("Servo sweep test. Watch each module bow outward in sequence.");
}

void loop() {
  for (int ch = 0; ch < NUM_SERVOS; ch++) {
    Serial.printf("Testing %s...\n", LABELS[ch]);
    for (int a = 0; a <= 40; a += 3) { writeAngle(ch, a); delay(60); }
    delay(500);
    for (int a = 40; a >= 0; a -= 3) { writeAngle(ch, a); delay(60); }
    delay(600);
  }
  delay(1000);
  Serial.println("One full cycle done. Repeating...");
}
