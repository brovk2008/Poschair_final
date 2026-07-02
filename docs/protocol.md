# PosChair BLE Protocol Specification

This document defines the binary communication protocol used over Bluetooth Low Energy (BLE) between the PosChair controller (ESP32-C3) and the Client Application.

---

## Device Information

- **BLE Device Local Name:** `POSCHAIR_001`
- **Custom Service UUID:** `a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e`

---

## BLE Characteristics

| Name | UUID | Properties | Description |
|---|---|---|---|
| **Command (RX)** | `a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e` | `Write` or `Write Without Response` | Send target angles to control the servos |
| **Status (TX)** | `a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e` | `Notify` | Stream battery voltage and current angles |

---

## 1. Command Packet (App → ESP32)

- **Size:** 8 bytes
- **Frequency:** Typically sent up to 10Hz when angles update.
- **Protocol Format:**

| Byte | Field | Type | Description |
|---|---|---|---|
| 0 | Header | `uint8_t` | Constant packet header identifier: `0xA5` |
| 1 | Servo 1 (Upper thoracic) | `uint8_t` | Target angle ($0\degree$ to $180\degree$) |
| 2 | Servo 2 (Lower thoracic) | `uint8_t` | Target angle ($0\degree$ to $180\degree$) |
| 3 | Servo 3 (Mid lumbar) | `uint8_t` | Target angle ($0\degree$ to $180\degree$) |
| 4 | Servo 4 (Mid lumbar) | `uint8_t` | Target angle ($0\degree$ to $180\degree$) |
| 5 | Servo 5 (Lower lumbar) | `uint8_t` | Target angle ($0\degree$ to $180\degree$) |
| 6 | Servo 6 (Pelvis) | `uint8_t` | Target angle ($0\degree$ to $180\degree$) |
| 7 | Checksum | `uint8_t` | XOR combination of bytes 0 through 6 |

### Checksum Logic

The checksum byte is verified using a bitwise XOR operation of the preceding 7 bytes:
$$\text{Checksum} = B_0 \oplus B_1 \oplus B_2 \oplus B_3 \oplus B_4 \oplus B_5 \oplus B_6$$

---

## 2. Status Packet (ESP32 → App)

- **Size:** 10 bytes
- **Frequency:** Broadcasted via Notify at a rate of 1Hz (every 1000ms), or immediately on change.
- **Protocol Format:**

| Byte | Field | Type | Description |
|---|---|---|---|
| 0 | Header | `uint8_t` | Constant packet header identifier: `0x5A` |
| 1 | Status Flags | `uint8_t` | Bit flags indicating device state:<br>- **Bit 0**: BLE Connection State ($1 = \text{connected}$, $0 = \text{disconnected}$)<br>- **Bit 1**: Failsafe State ($1 = \text{failsafe active}$, $0 = \text{operational}$)<br>- **Bits 2-7**: Reserved |
| 2–3 | Battery Voltage | `uint16_t` | Battery voltage level in millivolts (`mV`, Big Endian format) |
| 4 | Servo 1 (Upper thoracic) | `uint8_t` | Real-time interpolated angle ($0\degree$ to $180\degree$) |
| 5 | Servo 2 (Lower thoracic) | `uint8_t` | Real-time interpolated angle ($0\degree$ to $180\degree$) |
| 6 | Servo 3 (Mid lumbar) | `uint8_t` | Real-time interpolated angle ($0\degree$ to $180\degree$) |
| 7 | Servo 4 (Mid lumbar) | `uint8_t` | Real-time interpolated angle ($0\degree$ to $180\degree$) |
| 8 | Servo 5 (Lower lumbar) | `uint8_t` | Real-time interpolated angle ($0\degree$ to $180\degree$) |
| 9 | Servo 6 (Pelvis) | `uint8_t` | Real-time interpolated angle ($0\degree$ to $180\degree$) |

---

## 3. Watchdog Failsafe Mechanism

If the ESP32-C3 is connected via BLE, but **does not receive a valid Command packet for more than 2.0 seconds** (configurable via `FAILSAFE_TIMEOUT_MS`), it will automatically trigger the watchdog failsafe:
1. Active status flag is updated (Bit 1 set to 1).
2. Servos are immediately but smoothly returned to their neutral position (`90` degrees by default).
3. The board ignores manual targets until a new valid command packet is received.
