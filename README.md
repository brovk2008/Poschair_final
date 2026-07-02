# PosChair — AI Posture-Correcting Chair Attachment (V2)

[![Latest Release](https://img.shields.io/github/v/release/brovk2008/Poschair_final?label=download&color=5c8aff)](https://github.com/brovk2008/Poschair_final/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-gray)](LICENSE)
[![Website](https://img.shields.io/badge/website-poschair--comfort.vercel.app-gray)](https://poschair-comfort.vercel.app)

PosChair is an open-source, closed-loop posture correction system. It tracks your spine in real time using a standard webcam and automatically pushes dynamic corrective adjustments to a 2×3 paraspinal mechanical actuator grid on your chair via Bluetooth Low Energy (BLE).

---

## ⚡ System Flow

```
Camera (webcam) ──[MediaPipe Pose]──> Posture Analyser ──[BLE]──> ESP32-C3 ──► PCA9685 ──► 2×3 Paraspinal Actuators
```

---

## 🌟 Core Features (V2 Specification)

* **2×3 Paraspinal Actuator Grid**: 6 mechanical servos divided into two independent vertical columns (Left + Right × Upper + Mid + Bottom). Supports paraspinal muscle lines instead of sitting directly on the spine.
* **Active Left/Right Correction**: Automatically measures lateral tilt. If leaning right, the decision engine applies counter-tension to the left column to re-align your posture.
* **Pre-Curved Bow Mechanics**: Combines 0.9mm tempered spring steel with stock servo horn cable winding. Rest-state pre-curvature (~20mm) minimizes necessary servo travel (capped at 55° max safe angle) to optimize battery life and reduce torque requirements.
* **Local WASM AI Vision**: Runs MediaPipe Pose Landmarker entirely client-side in the browser. Zero camera frames or skeleton logs ever leave your computer.
* **Failsafe Watchdog Protection**: The ESP32-C3 firmware returns all servos to flat neutral positions if BLE communications are interrupted for more than 2 seconds.
* **Preset Correction Modes**: Choose between customized support curves optimized for Office, Study, Gaming, or Relaxing.

---

## 🚀 30-Second Quick Start

### 1. Assemble Hardware
Connect the **ESP32-C3 Mini** via I2C (SDA=GPIO8, SCL=GPIO9) to the **PCA9685 driver**. Connect **6× mechanical grid servos** to channels 0-5.
*(See detailed layout configurations in [hardware_wiring.md](file:///c:/Users/techp/Downloads/more%20projects/poschair_final/docs/hardware_wiring.md))*

### 2. Flash Firmware
Open `firmware/poschair_firmware/poschair_firmware.ino` in the **Arduino IDE 2.x**. Connect the ESP32-C3 and click **Upload**.
*(Target Board: ESP32C3 Dev Module · Enable "USB CDC On Boot")*

### 3. Run Dashboard App
From the `app/` folder, spin up the Docker-composed local dashboard:
```bash
docker-compose up --build
```
Open **[http://localhost:5173](http://localhost:5173)** in Chrome or Edge, click **Connect Chair**, and sit down.

---

## 🛠️ Diagnostics & Troubleshooting

* **Brownout Resets**: If the ESP32 resets when the servos begin moving, your power supply is insufficient. Ensure the servos are powered by a separate, dedicated **5V/3A+ external power supply** (not the USB line).
* **Web Bluetooth API**: Make sure to use Chrome or Edge. iOS Safari and Firefox do not support Web Bluetooth.
* **Diagnostics Sweep**: Flash [poschair_servo_test.ino](file:///c:/Users/techp/Downloads/more%20projects/poschair_final/firmware/poschair_servo_test/poschair_servo_test.ino) to verify physical servo wiring and ranges before running the main closed-loop software.
