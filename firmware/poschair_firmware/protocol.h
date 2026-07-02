#pragma once
#include <Arduino.h>

// ── Command Packet (App → ESP32) 8 bytes ─────────────────────────────
//
// Byte  Value
// [0]   0xA5  header
// [1]   Upper-Left  servo angle (0–55°)
// [2]   Upper-Right servo angle (0–55°)
// [3]   Mid-Left    servo angle (0–55°)
// [4]   Mid-Right   servo angle (0–55°)
// [5]   Lower-Left  servo angle (0–55°)
// [6]   Lower-Right servo angle (0–55°)
// [7]   XOR checksum of bytes [0..6]

#define CMD_HEADER       0xA5
#define CMD_PACKET_SIZE  8

struct CommandPacket {
  uint8_t header;
  uint8_t angles[6];   // index 0=UL, 1=UR, 2=ML, 3=MR, 4=LL, 5=LR
  uint8_t checksum;
};

inline uint8_t calcChecksum(uint8_t header, const uint8_t* angles) {
  uint8_t s = header;
  for (int i = 0; i < 6; i++) s ^= angles[i];
  return s;
}

inline bool parseCommand(const uint8_t* data, size_t len, CommandPacket& out) {
  if (len != CMD_PACKET_SIZE)                          return false;
  if (data[0] != CMD_HEADER)                           return false;
  if (data[7] != calcChecksum(data[0], &data[1]))      return false;
  out.header = data[0];
  memcpy(out.angles, &data[1], 6);
  out.checksum = data[7];
  return true;
}

// ── Status Packet (ESP32 → App) 10 bytes ─────────────────────────────
//
// Byte  Value
// [0]   0x5A  header
// [1]   flags: bit0=ok, bit1=failsafe_active, bit2=ble_connected
// [2]   battery mV high byte (big-endian uint16)
// [3]   battery mV low byte
// [4]   current angle UL
// [5]   current angle UR
// [6]   current angle ML
// [7]   current angle MR
// [8]   current angle LL
// [9]   current angle LR

#define STATUS_HEADER       0x5A
#define STATUS_PACKET_SIZE  10
