#pragma once
#include <Arduino.h>

// Module index map:
// 0=Upper-Left, 1=Upper-Right, 2=Mid-Left, 3=Mid-Right, 4=Lower-Left, 5=Lower-Right
#define NUM_MODULES 6

// BTS7960 pins. RPWM drives rack out, LPWM drives rack in.
const uint8_t RPWM_PINS[NUM_MODULES] = {0, 2, 4, 6, 8, 10};
const uint8_t LPWM_PINS[NUM_MODULES] = {1, 3, 5, 7, 9, 20};

#define EN_PIN 21
#define LIMIT_SW_PINS_USED false

// Motor PWM settings for ESP32 Arduino core v3 ledcAttach/ledcWrite API.
#define MOTOR_PWM_NORMAL 200
#define MOTOR_PWM_HOMING 150
#define MOTOR_PWM_FREQ 5000
#define MOTOR_PWM_RES 8

// Timed position model: position unit 0-100 maps to 0-100mm extension.
#define MOTOR_SPEED_MM_PER_MS 0.075f
#define MAX_POSITION_MM 100
#define POSITION_UNIT_TO_MM 1.0f

// Homing and safety.
#define HOMING_TIMEOUT_MS 3000
#define HOMING_EXTRA_MS 200
#define FAILSAFE_TIMEOUT_MS 2000
#define MIN_POSITION_CHANGE 3

// BLE UUIDs. Must match app/frontend/src/bleManager.ts exactly.
#define BLE_DEVICE_NAME "POSCHAIR_001"
#define SERVICE_UUID "a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e"
#define COMMAND_CHAR_UUID "a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e"
#define STATUS_CHAR_UUID "a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e"

#define STATUS_INTERVAL_MS 1000
