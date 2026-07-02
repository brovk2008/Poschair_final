# PosChair Hardware Wiring Diagram

This document details the wiring layout and physical pin mappings for the PosChair posture-correcting chair attachment.

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
       +-----------------------+-----------------------+
       |                       |                       |
       v (Ch 0)                v (Ch 1)                v (Ch 5)
+--------------+        +--------------+        +--------------+
| Servo 1 (UT) |        | Servo 2 (LT) |  ...   | Servo 6 (P)  |
+--------------+        +--------------+        +--------------+
```

---

## 2. Pin Mapping Details

### 2.1 ESP32-C3 to PCA9685 Logic Connections

| ESP32-C3 Pin | PCA9685 Control Pin | Connection Color (Std) | Description |
|---|---|---|---|
| **GPIO 8** | `SDA` | Green | I2C Data Line |
| **GPIO 9** | `SCL` | Yellow | I2C Clock Line |
| **GND** | `GND` | Black | Common Logic Ground |
| **3.3V / 5V** | `VCC` | Red | Logic Power Supply (from ESP32 regulator) |

### 2.2 PCA9685 to Servos Pin Mapping

| PCA9685 PWM Channel | Anatomical Location | Target Muscle / Spine Zone | Servo Type |
|---|---|---|---|
| **Channel 0** | Module 1 (Top) | Upper Thoracic | MG996R / MG90S |
| **Channel 1** | Module 2 | Lower Thoracic | MG996R |
| **Channel 2** | Module 3 | Mid Lumbar | MG996R |
| **Channel 3** | Module 4 | Mid Lumbar | MG996R |
| **Channel 4** | Module 5 | Lower Lumbar | MG996R |
| **Channel 5** | Module 6 (Bottom)| Pelvic Support | MG996R |

---

## 3. Power Distribution Warnings

> [!WARNING]
> **Servo Current Draw Limits**
> Do **NOT** power the PCA9685 servo power terminal (`V+` / green screw terminal) using the ESP32's `5V` or `3.3V` out pins. MG996R servos can draw up to 2.5A each under stall conditions. A single peak command could trigger an brown-out reset on the ESP32-C3 or permanently damage its voltage regulator.
>
> Ensure there is a **common ground (GND)** connection between the ESP32-C3's GND pins, the PCA9685's logic GND, and the external battery pack's negative terminal to maintain a reference level for I2C and PWM signaling.
