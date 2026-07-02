# PosChair Hardware Wiring Diagram (V2)

This document details the wiring layout, physical pin mappings, and grid configurations for the PosChair posture-correcting chair attachment.

---

## 1. System Topology

```
                  [External 5V Battery Pack]
                       |             |
                       +-(+5V)       +-(GND)
                       |             |
                       v [V+]        v [GND]
                 +-----------------------+
                 |    PCA9685 Driver     |
                 | (Servo Power Terminal)|
                 +-----------------------+
                             |
         +-------------------+-------------------+
         | (SDA)             | (SCL)             | (GND)
         v                   v                   v
+-----------------+   +----------------------------------+
|    ESP32-C3     |   |          PCA9685 Board           |
| (Control Unit)  |   |           (VCC Pin)              |
|                 |   |                                  |
|   GPIO 8 (SDA)  |-->| SDA Pin                          |
|   GPIO 9 (SCL)  |-->| SCL Pin                          |
|   GND           |<--| GND Pin                          |
|   3.3V / 5V     |-->| VCC Pin (Logic Power)            |
+-----------------+   +----------------------------------+
                               |
        +----------------------+-----------------------+
        |                      |                       |
        v (Ch 0)               v (Ch 1)                v (Ch 5)
+---------------+      +---------------+       +---------------+
| UL Servo (CH0)|      | UR Servo (CH1)|  ...  | LR Servo (CH5)|
+---------------+      +---------------+       +---------------+
```

---

## 2. Pin Mapping Details

### 2.1 ESP32-C3 to PCA9685 Logic Connections

| ESP32-C3 Pin | PCA9685 Control Pin | Connection Color (Std) | Description |
|---|---|---|---|
| **GPIO 8** | `SDA` | Green | I2C Data Line |
| **GPIO 9** | `SCL` | Yellow | I2C Clock Line |
| **GND** | `GND` | Black | Common Logic Ground |
| **3.3V** | `VCC` | Red | Logic Power Supply (from ESP32 regulator) |

### 2.2 Battery Voltage Divider Connection
For battery monitoring, wire a voltage divider from your battery pack positive terminal directly to **GPIO 3** (ADC) on the ESP32-C3:
```
Battery + ── R1 (100kΩ) ──┬── GPIO 3 (ESP32-C3)
                          │
                          └── R2 (100kΩ) ── GND
```

### 2.3 PCA9685 to Servos Pin Mapping (2×3 Grid)

| PCA9685 PWM Channel | Actuator ID | Anatomical Location | Grid Row & Column |
|---|---|---|---|
| **Channel 0** | `UL` | Upper-Left | Row 1 (Upper), Left Column |
| **Channel 1** | `UR` | Upper-Right | Row 1 (Upper), Right Column |
| **Channel 2** | `ML` | Mid-Left | Row 2 (Mid), Left Column |
| **Channel 3** | `MR` | Mid-Right | Row 2 (Mid), Right Column |
| **Channel 4** | `LL` | Lower-Left | Row 3 (Lower), Left Column |
| **Channel 5** | `LR` | Lower-Right | Row 3 (Lower), Right Column |

---

## 3. Physical Layout Guide

Looking at the chair back from the front (user's perspective):
```
        LEFT COLUMN       RIGHT COLUMN
        (user's right)    (user's left)
        
ROW 1:  [UL - CH0]       [UR - CH1]     ← Upper Thoracic
ROW 2:  [ML - CH2]       [MR - CH3]     ← Mid Lumbar
ROW 3:  [LL - CH4]       [LR - CH5]     ← Lower Lumbar / Pelvis
```
* **Gap spacing**: Keep a ~2cm gap between the left and right columns to prevent placing modules directly over the spine, supporting the paraspinal muscles on each side.
* **Travel limit**: The servos are capped at **55°** max safe angle to prevent over-tensioning the pre-curved spring steel bands.

---

## 4. Power Distribution Warnings

> [!WARNING]
> **Servo Current Draw Limits**
> Do **NOT** power the PCA9685 servo power terminal (`V+` / green screw terminal) using the ESP32's `5V` or `3.3V` out pins. MG996R servos can draw up to 2.5A each under stall conditions. A single peak command could trigger a brown-out reset on the ESP32-C3.
>
> Ensure there is a **common ground (GND)** connection between the ESP32-C3's GND pins, the PCA9685's logic GND, and the external battery pack's negative terminal to maintain a reference level for I2C and PWM signaling.
