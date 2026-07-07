# PosChair V3 Build Wiring Guide

This is the build-facing wiring reference for the ESP32 DevKit V1 version of PosChair V3. Follow this when connecting the ESP32, six BTS7960 motor drivers, six DC geared motors, the 12V motor supply, and the battery voltage divider.

## Read This First

- Do not power motors from the ESP32, USB, or breadboard power rails.
- Use a separate motor supply sized for the stall current of all six motors.
- All grounds must be common: ESP32 GND, BTS7960 GND, motor battery negative, and voltage-divider ground.
- Avoid ESP32 GPIO0, GPIO2, GPIO12, and GPIO15 for motors because they are boot-strapping pins.
- Avoid GPIO6-GPIO11 because they are connected to onboard flash.
- Wire and test one motor module first before connecting all six.

## Parts In This Wiring

| Item | Qty | Notes |
|---|---:|---|
| ESP32 DevKit V1, 38-pin | 1 | Arduino board target: `ESP32 Dev Module` |
| BTS7960 H-bridge driver | 6 | One driver per actuator |
| DC geared motor | 6 | One motor per worm-rack actuator |
| Worm-rack actuator + foam pad | 6 | 0-100mm travel target |
| 12V motor battery / supply | 1 | Motor power rail only |
| 100k resistor | 2 | Battery voltage divider |
| Common ground bus | 1 | Required |
| Inline fuse / switch | 1 recommended | Put on battery positive |

## Physical Grid

```text
        LEFT COLUMN      RIGHT COLUMN

ROW 1:  [M0 UL]         [M1 UR]       Upper thoracic / shoulder
ROW 2:  [M2 ML]         [M3 MR]       Mid lumbar
ROW 3:  [M4 LL]         [M5 LR]       Lower lumbar / pelvis
```

Keep a 2cm open gap between left and right columns. The foam pads should contact paraspinal muscles, not the spine itself.

## Full Connection Map

Label your BTS7960 boards `M0` through `M5` before wiring.

| Module | Body Position | BTS7960 RPWM | BTS7960 LPWM | BTS7960 R_EN | BTS7960 L_EN | Motor Output |
|---|---|---:|---:|---:|---:|---|
| M0 | Upper-Left | ESP32 GPIO25 | ESP32 GPIO26 | ESP32 GPIO5 | ESP32 GPIO5 | M0 motor `M+` / `M-` |
| M1 | Upper-Right | ESP32 GPIO27 | ESP32 GPIO16 | ESP32 GPIO5 | ESP32 GPIO5 | M1 motor `M+` / `M-` |
| M2 | Mid-Left | ESP32 GPIO14 | ESP32 GPIO13 | ESP32 GPIO5 | ESP32 GPIO5 | M2 motor `M+` / `M-` |
| M3 | Mid-Right | ESP32 GPIO17 | ESP32 GPIO18 | ESP32 GPIO5 | ESP32 GPIO5 | M3 motor `M+` / `M-` |
| M4 | Lower-Left | ESP32 GPIO21 | ESP32 GPIO22 | ESP32 GPIO5 | ESP32 GPIO5 | M4 motor `M+` / `M-` |
| M5 | Lower-Right | ESP32 GPIO23 | ESP32 GPIO19 | ESP32 GPIO5 | ESP32 GPIO5 | M5 motor `M+` / `M-` |

## ESP32 Pin Checklist

| ESP32 Pin | Connect To | Purpose |
|---:|---|---|
| GPIO25 | M0 BTS7960 `RPWM` | Upper-left extend PWM |
| GPIO26 | M0 BTS7960 `LPWM` | Upper-left retract PWM |
| GPIO27 | M1 BTS7960 `RPWM` | Upper-right extend PWM |
| GPIO16 | M1 BTS7960 `LPWM` | Upper-right retract PWM |
| GPIO14 | M2 BTS7960 `RPWM` | Mid-left extend PWM |
| GPIO13 | M2 BTS7960 `LPWM` | Mid-left retract PWM |
| GPIO17 | M3 BTS7960 `RPWM` | Mid-right extend PWM |
| GPIO18 | M3 BTS7960 `LPWM` | Mid-right retract PWM |
| GPIO21 | M4 BTS7960 `RPWM` | Lower-left extend PWM |
| GPIO22 | M4 BTS7960 `LPWM` | Lower-left retract PWM |
| GPIO23 | M5 BTS7960 `RPWM` | Lower-right extend PWM |
| GPIO19 | M5 BTS7960 `LPWM` | Lower-right retract PWM |
| GPIO5 | All BTS7960 `R_EN` and `L_EN` | Shared driver enable |
| GPIO34 | Voltage divider midpoint | Battery voltage ADC |
| 3.3V | All BTS7960 `VCC` pins | Logic power |
| GND | Ground bus | Common logic and motor reference |

## BTS7960 Pin Checklist

Repeat this for each of the six BTS7960 boards.

| BTS7960 Pin | Connect To | Notes |
|---|---|---|
| `RPWM` | Assigned ESP32 RPWM GPIO | Motor extends foam pad when active |
| `LPWM` | Assigned ESP32 LPWM GPIO | Motor retracts foam pad when active |
| `R_EN` | ESP32 GPIO5 | Shared enable |
| `L_EN` | ESP32 GPIO5 | Shared enable |
| `VCC` | ESP32 3.3V | Logic only |
| `GND` | Common ground bus | Must share ESP32 and battery ground |
| `B+` | 12V motor supply positive | Put fuse/switch before distribution |
| `B-` | 12V motor supply negative | Same as common ground |
| `M+` | Motor terminal 1 | Swap with `M-` if direction is reversed |
| `M-` | Motor terminal 2 | Swap with `M+` if direction is reversed |

## Motor Direction Rule

Firmware assumes:

```text
RPWM active, LPWM 0  -> actuator extends, foam pushes out
LPWM active, RPWM 0  -> actuator retracts, foam pulls in
```

If a module moves the wrong way during `poschair_motor_test.ino`, do not change code first. Swap that module motor's `M+` and `M-` wires on the BTS7960 output.

## Power Wiring

```text
12V supply positive -> fuse/switch -> split to all BTS7960 B+ terminals
12V supply negative -> ground bus -> all BTS7960 B- terminals
ESP32 GND -----------> same ground bus
All BTS7960 GND -----> same ground bus
ESP32 3.3V ----------> all BTS7960 VCC logic pins
```

Use thicker wire for `B+`, `B-`, `M+`, and `M-` than for ESP32 signal wires.

## Battery Voltage Divider

Use two 100k resistors so the ESP32 ADC sees half of the battery voltage.

```text
Battery + ---- R1 100k ----+---- ESP32 GPIO34
                           |
                           R2 100k
                           |
Ground bus ----------------+
```

Firmware constants:

```cpp
#define BATTERY_ADC_PIN 34
#define BATTERY_ADC_MAX 4095
#define BATTERY_REF_MV 3300
#define BATTERY_DIVIDER 2.0f
```

## Build Order

1. Mount the six actuator modules on the chair frame.
2. Label each motor wire pair as `M0` through `M5`.
3. Label each BTS7960 board as `M0` through `M5`.
4. Wire only the M0 driver and motor first.
5. Connect ESP32 GND to the motor supply ground.
6. Connect M0 `RPWM`, `LPWM`, `R_EN`, `L_EN`, `VCC`, and `GND`.
7. Connect M0 `B+`, `B-`, `M+`, and `M-`.
8. Flash `firmware/poschair_motor_test/poschair_motor_test.ino`.
9. Confirm M0 extends during OUT and retracts during IN.
10. If M0 direction is wrong, swap M0 `M+` and `M-`.
11. Repeat the same process for M1 through M5.
12. After all six pass the motor test, flash `firmware/poschair_firmware/poschair_firmware.ino`.

## First Power-Up Test

Use this sequence before wearing or leaning against the chair:

1. Keep motors disconnected from the user's back.
2. Power ESP32 from USB only.
3. Open Serial Monitor at `115200`.
4. Confirm boot message prints.
5. Power the 12V motor rail.
6. Run the motor test sketch.
7. Confirm every module extends and retracts in the correct physical location.
8. Measure 2000ms travel for each actuator.
9. Calculate `MOTOR_SPEED_MM_PER_MS = measured_mm / 2000.0`.
10. Update `firmware/poschair_firmware/config.h`.
11. Flash the main firmware.
12. Confirm startup homing retracts all modules.

## Arduino IDE Target

- Board: `ESP32 Dev Module`
- CPU Frequency: `240MHz`
- Upload Speed: `921600`
- Flash Size: `4MB`
- Partition Scheme: `Default 4MB with spiffs`
- USB CDC On Boot: not applicable on DevKit V1

If upload fails, hold the BOOT button while starting upload and release it after `Connecting...` appears.

## Quick Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| ESP32 resets when motors move | Motor power sag or shared weak supply | Use stronger 12V supply and common ground |
| Motor does not move | EN not HIGH, no motor power, wrong driver pin | Check GPIO5 to R_EN/L_EN and B+/B- |
| Motor moves backward | Motor output polarity reversed | Swap `M+` and `M-` on that driver |
| Only one direction works | RPWM/LPWM swapped or loose wire | Recheck assigned GPIO and BTS7960 pin |
| BLE works but motors do nothing | Driver enable/power missing | Check GPIO5, VCC, GND, B+ and B- |
| Battery reading is wrong | Divider values or ground wrong | Use two equal resistors and common ground |
| Upload fails | DevKit boot mode issue | Hold BOOT until upload starts |

## Final Safety Check

- All `B-` and ESP32 `GND` points share a common ground.
- No motor current flows through the ESP32 board.
- Every motor can retract before testing extension.
- Foam pads have soft edges and mechanical travel limits.
- The first full test is done without a person leaning on the chair.
