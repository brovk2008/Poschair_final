#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#define PCA9685_ADDR 0x40
#define SERVO_FREQ 50
#define NUM_SERVOS 6

#define USMIN 500  // Minimum pulse width (typically 500 us)
#define USMAX 2500 // Maximum pulse width (typically 2500 us)

// I2C pins for ESP32-C3 Mini
#define I2C_SDA 8
#define I2C_SCL 9

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(PCA9685_ADDR);

// Convert angle (0-180) to microseconds and write
void setServoAngle(uint8_t channel, int angle) {
  int constrainedAngle = constrain(angle, 0, 180);
  int pulseUs = map(constrainedAngle, 0, 180, USMIN, USMAX);
  pwm.writeMicroseconds(channel, pulseUs);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("--- PosChair Standalone Servo Sweep Test Starting ---");

  Wire.begin(I2C_SDA, I2C_SCL);
  Serial.printf("I2C initialized Scl/Sda on GPIO pins [%d, %d]\n", I2C_SDA, I2C_SCL);

  pwm.begin();
  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(SERVO_FREQ);
  delay(10);

  // Set all to neutral
  Serial.println("Setting all servos to 90 degrees (Neutral)...");
  for (int i = 0; i < NUM_SERVOS; i++) {
    setServoAngle(i, 90);
  }
  delay(2000);
}

void loop() {
  Serial.println("Sweeping servos from 90 to 130 degrees...");
  for (int angle = 90; angle <= 130; angle++) {
    for (int i = 0; i < NUM_SERVOS; i++) {
      setServoAngle(i, angle);
    }
    delay(30);
  }
  delay(1000);

  Serial.println("Sweeping servos from 130 down to 50 degrees...");
  for (int angle = 130; angle >= 50; angle--) {
    for (int i = 0; i < NUM_SERVOS; i++) {
      setServoAngle(i, angle);
    }
    delay(30);
  }
  delay(1000);

  Serial.println("Sweeping servos back to 90 degrees...");
  for (int angle = 50; angle <= 90; angle++) {
    for (int i = 0; i < NUM_SERVOS; i++) {
      setServoAngle(i, angle);
    }
    delay(30);
  }
  delay(2000);
}
