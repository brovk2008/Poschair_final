# PosChair — AI Posture-Correcting Spine Corrector

[![Latest Release](https://img.shields.io/github/v/release/brovk2008/Poschair_final?label=download&color=5c8aff)](https://github.com/brovk2008/Poschair_final/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-gray)](LICENSE)
[![Website](https://img.shields.io/badge/website-poschair.vercel.app-gray)](https://poschair.vercel.app)

PosChair is an AI-powered posture-correcting chair attachment that bridges a **digital spine** (pose-tracking camera analysis) and a **mechanical spine** (6× servo-driven spring-steel modules).

---

## 1. System Topology

```
Camera (browser) → MediaPipe Pose → Posture Analyzer → Decision Engine
        → BLE Manager → [BLE] → ESP32-C3 → PCA9685 → 6× Servos
        → Cable → Spring Steel Strip → Foam → User's Back
        → Camera re-checks posture (closed loop)
```

---

## 2. Directory Structure

- **`firmware/`**: Arduino IDE project codes.
  - **`poschair_firmware/`**: NimBLE bluetooth services and PCA9685 control sketch loops.
  - **`poschair_servo_test/`**: Diagnostic bring-up sweeping sketch (without BLE).
- **`app/`**: Docker-composed fullstack application.
  - **`backend/`**: Python FastAPI routers communicating with a PostgreSQL database.
  - **`frontend/`**: Vite + React single-page cybernetic dashboard incorporating client-side WebAssembly MediaPipe tracking.
- **`docs/`**: Detailed hardware wiring pinout mappings and custom binary BLE protocols.

---

## 3. Running & Execution Guidelines

### 3.1 Start the Web Application (Docker Compose)
From the root of the `./app` directory, run:

```bash
docker-compose up --build
```
- **Frontend Panel**: [http://localhost:5173](http://localhost:5173)
- **FastAPI backend docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3.2 Compiling & Uploading Firmware (Arduino IDE)
1. Install **Arduino IDE 2.x**.
2. Navigate to **File → Preferences → Additional Boards Manager URLs** and add:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Go to **Tools → Board → Boards Manager**, search "esp32", and install **"esp32 by Espressif Systems"** v3.x.
4. Select **Tools → Board → ESP32 → ESP32C3 Dev Module**.
5. Configure board properties:
   - **USB CDC On Boot**: Enabled
   - **Flash Size**: 4MB
   - **Partition Scheme**: Default 4MB with spiffs
   - **Upload Speed**: 921600
6. Search and install dependencies in the **Library Manager**:
   - **NimBLE-Arduino** by h2zero
   - **Adafruit PWM Servo Driver Library** by Adafruit
7. Open `firmware/poschair_firmware/poschair_firmware.ino`, select the serial COM port under **Tools → Port**, and click **Upload**.

---

## 4. Operational Troubleshooting

- **Brownout Resets**: If the ESP32 resets repeatedly when the servos begin moving, it confirms the battery/external power is insufficient or is wired incorrectly. Ensure the PCA9685 green power terminal is connected directly to a separate 5V battery block, sharing a common ground pin with the ESP32.
- **Web Bluetooth Pairing**: Make sure you use a compatible browser (Desktop/Android Chrome/Edge). iOS Safari does not support the Web Bluetooth API.
