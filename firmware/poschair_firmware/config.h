#pragma once

// ── I2C ──────────────────────────────────────────────────────────────
#define I2C_SDA_PIN        8
#define I2C_SCL_PIN        9

// ── Battery ADC ──────────────────────────────────────────────────────
#define BATTERY_ADC_PIN    3       // GPIO3, reads voltage-divider midpoint
#define BATTERY_ADC_MAX    4095
#define BATTERY_REF_MV     3300    // ESP32-C3 ADC reference voltage
#define BATTERY_DIVIDER    2.0f    // multiply ADC result to recover actual voltage

// ── Servos ───────────────────────────────────────────────────────────
#define NUM_SERVOS         6
#define SERVO_MIN_PULSE    500     // microseconds → 0°
#define SERVO_MAX_PULSE    2500    // microseconds → 180°
#define NEUTRAL_ANGLE      0       // flat, resting position (degrees)
#define MAX_SAFE_ANGLE     70      // hard clamp; tune after Phase 0 mechanical test

// ── Motion easing ────────────────────────────────────────────────────
#define SERVO_STEP_DEG     2       // degrees moved per update tick
#define SERVO_UPDATE_MS    20      // update tick interval (50 Hz)

// ── BLE ──────────────────────────────────────────────────────────────
#define BLE_DEVICE_NAME    "POSCHAIR_001"
#define SERVICE_UUID       "a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e"
#define COMMAND_CHAR_UUID  "a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e"
#define STATUS_CHAR_UUID   "a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e"

// ── Timing ───────────────────────────────────────────────────────────
#define FAILSAFE_TIMEOUT_MS  2000   // no valid packet → go neutral
#define STATUS_INTERVAL_MS   1000   // how often to send status notify
