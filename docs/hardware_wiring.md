# PosChair Hardware Wiring Diagram (V3)

V3 uses six BTS7960 H-bridge motor drivers. Each module is a DC geared motor driving a worm-rack actuator and foam pad.

## System Topology

```text
12V motor battery + -----> BTS7960 B+ pins
12V motor battery - -----> BTS7960 B- pins ----+
                                                |
ESP32-C3 GND ----------------------------------+

ESP32-C3 PWM pins -> BTS7960 RPWM/LPWM pins -> DC motors -> worm-rack actuators
5V logic rail -----> BTS7960 VCC pins
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

## ESP32-C3 Pin Assignment

| GPIO | Function | Module |
|---|---|---|
| GPIO0 | RPWM | M0 Upper-Left |
| GPIO1 | LPWM | M0 Upper-Left |
| GPIO2 | RPWM | M1 Upper-Right |
| GPIO3 | LPWM | M1 Upper-Right |
| GPIO4 | RPWM | M2 Mid-Left |
| GPIO5 | LPWM | M2 Mid-Left |
| GPIO6 | RPWM | M3 Mid-Right |
| GPIO7 | LPWM | M3 Mid-Right |
| GPIO8 | RPWM | M4 Lower-Left |
| GPIO9 | LPWM | M4 Lower-Left |
| GPIO10 | RPWM | M5 Lower-Right |
| GPIO20 | LPWM | M5 Lower-Right |
| GPIO21 | Shared enable | All BTS7960 R_EN/L_EN |

For a hackathon build, you may tie all BTS7960 `R_EN` and `L_EN` pins HIGH. The firmware also supports the shared `EN_PIN` on GPIO21.

## BTS7960 Per-Driver Wiring

| BTS7960 Pin | Connect To | Purpose |
|---|---|---|
| RPWM | Assigned ESP32 GPIO | Forward PWM: rack extends, foam pushes out |
| LPWM | Assigned ESP32 GPIO | Reverse PWM: rack retracts |
| R_EN | GPIO21 or 5V | Enable right half-bridge |
| L_EN | GPIO21 or 5V | Enable left half-bridge |
| VCC | 5V logic | Driver logic power |
| GND | Common GND | Shared reference |
| B+ | 6-12V motor battery + | Motor rail |
| B- | Motor battery GND | Motor rail ground |
| M+ / M- | DC motor terminals | Output to motor |

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
