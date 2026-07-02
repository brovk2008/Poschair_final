#pragma once

// ── I2C ──────────────────────────────────────────────────────────────
#define I2C_SDA_PIN         8
#define I2C_SCL_PIN         9

// ── Battery ADC ──────────────────────────────────────────────────────
#define BATTERY_ADC_PIN     3
#define BATTERY_ADC_MAX     4095
#define BATTERY_REF_MV      3300
#define BATTERY_DIVIDER     2.0f    // R1=R2=100kΩ divider

// ── Module index → PCA9685 channel map ───────────────────────────────
// These MUST match the physical wiring
#define CH_UPPER_LEFT       0
#define CH_UPPER_RIGHT      1
#define CH_MID_LEFT         2
#define CH_MID_RIGHT        3
#define CH_LOWER_LEFT       4
#define CH_LOWER_RIGHT      5
#define NUM_SERVOS          6

// ── Servo pulse width (microseconds) ─────────────────────────────────
#define SERVO_MIN_PULSE     500     // 0°
#define SERVO_MAX_PULSE     2500    // 180°

// ── Angle limits ─────────────────────────────────────────────────────
// Pre-curved strips: 0° = strip at pre-curve resting position (~20mm bulge)
// 55° = maximum, strip at ~45-50mm bulge. Never exceed.
#define NEUTRAL_ANGLE       0
#define MAX_SAFE_ANGLE      55

// ── Motion easing ────────────────────────────────────────────────────
#define SERVO_STEP_DEG      2       // degrees per update tick
#define SERVO_UPDATE_MS     20      // 50 Hz update rate

// ── BLE ──────────────────────────────────────────────────────────────
#define BLE_DEVICE_NAME     "POSCHAIR_001"
#define SERVICE_UUID        "a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e"
#define COMMAND_CHAR_UUID   "a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e"
#define STATUS_CHAR_UUID    "a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e"

// ── Timing ───────────────────────────────────────────────────────────
#define FAILSAFE_TIMEOUT_MS 2000
#define STATUS_INTERVAL_MS  1000
