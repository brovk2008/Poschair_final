# PosChair — AI Posture-Correcting Chair Attachment

[![Latest Release](https://img.shields.io/github/v/release/brovk2008/Poschair_final?label=download&color=5c8aff)](https://github.com/brovk2008/Poschair_final/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-gray)](LICENSE)
[![Website](https://img.shields.io/badge/website-poschair--comfort.vercel.app-gray)](https://poschair-comfort.vercel.app)

PosChair is an open-source, closed-loop posture correction system. It tracks your spine in real time using a standard webcam and automatically pushes corrective adjustments to a 6-segment mechanical spine on your chair via Bluetooth Low Energy (BLE).

---

## ⚡ System Flow

```
Camera (browser) ──[MediaPipe AI]──> Posture Analyser ──[BLE]──> ESP32-C3 ──> PCA9685 ──> 6× Spring-Steel Bow Actuators
```

---

## 🚀 30-Second Quick Start

### 1. Assemble Hardware
Connect the **ESP32-C3 Mini** via I2C to the **PCA9685 driver**. Connect **6× mechanical bow servos** to channels 0-5.
*(See detailed wiring in [hardware_wiring.md](file:///c:/Users/techp/Downloads/more%20projects/poschair_final/docs/hardware_wiring.md))*

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
