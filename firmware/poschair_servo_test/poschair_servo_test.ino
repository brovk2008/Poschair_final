// PosChair Servo Sweep Test — no BLE
// Flash this before the real firmware to confirm PCA9685 wiring

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#define SDA_PIN 8
#define SCL_PIN 9
#define NUM_SERVOS 6
#define MIN_PULSE 500
#define MAX_PULSE 2500

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
  Serial.println("Servo sweep test. Sweeping each channel 0->60->0 degrees.");
  for (int i = 0; i < NUM_SERVOS; i++) writeAngle(i, 0);
  delay(1000);
}

void loop() {
  for (int ch = 0; ch < NUM_SERVOS; ch++) {
    Serial.print("Channel "); Serial.println(ch);
    for (int a = 0; a <= 60; a += 3)  { writeAngle(ch, a); delay(60); }
    for (int a = 60; a >= 0; a -= 3)  { writeAngle(ch, a); delay(60); }
    delay(400);
  }
}
