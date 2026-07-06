# PosChair Hardware Wiring Diagram (V3 - ESP32 DevKit V1)

V3 uses an ESP32 DevKit V1 38-pin board, six BTS7960 H-bridge motor drivers, and six DC geared worm-rack actuator modules.

## System Topology

```text
12V motor battery + -----> BTS7960 B+ pins
12V motor battery - -----> BTS7960 B- pins ----+
                                                |
ESP32 DevKit GND ------------------------------+

ESP32 PWM pins -> BTS7960 RPWM/LPWM pins -> DC motors -> worm-rack actuators
3.3V logic rail -> BTS7960 VCC pins
GPIO5 -----------> all BTS7960 R_EN + L_EN pins
GPIO34 ----------> battery divider midpoint
```

Use a common ground between ESP32 logic, BTS7960 logic, and motor battery ground.

## 2x3 Module Layout

```text
        LEFT COLUMN      RIGHT COLUMN

ROW 1:  [UL - M0]       [UR - M1]    Upper thoracic / shoulder
ROW 2:  [ML - M2]       [MR - M3]    Mid lumbar
ROW 3:  [LL - M4]       [LR - M5]    Lower lumbar / pelvis
```

Keep a 2cm spine gap between the columns so modules press paraspinal muscles, not spinous processes.

## ESP32 DevKit V1 Pin Assignment

The pin map avoids GPIO0, GPIO2, GPIO12, and GPIO15 because they are boot-strapping pins. It also avoids GPIO6-GPIO11 because they are connected to onboard flash.

| Module | RPWM GPIO | LPWM GPIO | BTS7960 LEDC channels |
|---|---:|---:|---|
| M0 Upper-Left | GPIO25 | GPIO26 | ch0, ch1 |
| M1 Upper-Right | GPIO27 | GPIO16 | ch2, ch3 |
| M2 Mid-Left | GPIO14 | GPIO13 | ch4, ch5 |
| M3 Mid-Right | GPIO17 | GPIO18 | ch6, ch7 |
| M4 Lower-Left | GPIO21 | GPIO22 | ch8, ch9 |
| M5 Lower-Right | GPIO23 | GPIO19 | ch10, ch11 |

| Shared Signal | ESP32 GPIO | Connect To |
|---|---:|---|
| Driver enable | GPIO5 | All BTS7960 `R_EN` and `L_EN` pins |
| Battery ADC | GPIO34 | Voltage divider midpoint |
| Common ground | GND | ESP32, BTS7960 logic, motor battery ground |
| Logic power | 3.3V | BTS7960 VCC logic pins |
| Motor power | External 12V | BTS7960 B+ and B- motor terminals |

GPIO34 is input-only and works well for ADC sensing.

## Battery Voltage Divider

```text
Battery + ---- R1 100k ----+---- GPIO34
                           |
                           R2 100k
                           |
Battery - / GND -----------+
```

Firmware constants:

```cpp
#define BATTERY_ADC_PIN 34
#define BATTERY_ADC_MAX 4095
#define BATTERY_REF_MV 3300
#define BATTERY_DIVIDER 2.0f
```

## BTS7960 Per-Driver Wiring

| BTS7960 Pin | Connect To | Purpose |
|---|---|---|
| RPWM | Assigned ESP32 GPIO | Forward PWM: rack extends, foam pushes out |
| LPWM | Assigned ESP32 GPIO | Reverse PWM: rack retracts |
| R_EN | GPIO5 | Enable right half-bridge |
| L_EN | GPIO5 | Enable left half-bridge |
| VCC | ESP32 3.3V | Driver logic power |
| GND | Common GND | Shared reference |
| B+ | 12V motor battery + | Motor rail |
| B- | Motor battery GND | Motor rail ground |
| M+ / M- | DC motor terminals | Output to motor |

## Arduino IDE Target

- Board: `ESP32 Dev Module`
- CPU Frequency: `240MHz`
- Upload Speed: `921600`
- Flash Size: `4MB`
- Partition Scheme: `Default 4MB with spiffs`
- USB CDC On Boot: not applicable on DevKit V1

If upload fails, hold the BOOT button while starting upload and release it after `Connecting...` appears.

## Position Model

- Chain/rack length: 160mm
- Max commanded travel: 100mm
- Command units: 0-100 = 0-100mm
- Normal PWM: 200/255
- Homing PWM: 150/255

Calibrate with `firmware/poschair_motor_test/poschair_motor_test.ino`:

```text
MOTOR_SPEED_MM_PER_MS = measured_mm / 2000.0
```

Then update `MOTOR_SPEED_MM_PER_MS` in `firmware/poschair_firmware/config.h`.

## Homing

On every power-on, the firmware runs all motors backward for `HOMING_TIMEOUT_MS` to retract the racks and set current position to 0mm. If you add limit switches later, replace the blind timeout with switch-based homing.

## Power Warnings

Do not power the DC motors from the ESP32 or USB. Use a separate motor battery or power supply sized for the stall current of all six motors. Keep the motor rail, BTS7960 logic, and ESP32 logic grounds connected.
