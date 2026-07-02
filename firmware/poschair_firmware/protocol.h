#pragma once
#include <Arduino.h>

// ── Command Packet (App → ESP32) ─────────────────────────────────────
// 8 bytes total
// [0]    0xA5 (header)
// [1]    servo 0 target angle (0–70)
// [2]    servo 1 target angle
// [3]    servo 2 target angle
// [4]    servo 3 target angle
// [5]    servo 4 target angle
// [6]    servo 5 target angle
// [7]    checksum = XOR of bytes [0..6]

#define CMD_HEADER      0xA5
#define CMD_PACKET_SIZE 8

#pragma pack(push, 1)
struct CommandPacket {
  uint8_t header;
  uint8_t angles[6];
  uint8_t checksum;
};

// Status Packet (ESP32 → App)
// 10 bytes total
// [0]    0x5A (header)
// [1]    flags: bit0=ok, bit1=failsafe_active, bit2=ble_connected
// [2]    battery mV high byte (big-endian)
// [3]    battery mV low byte
// [4]    current angle servo 0
// [5]    current angle servo 1
// [6]    current angle servo 2
// [7]    current angle servo 3
// [8]    current angle servo 4
// [9]    current angle servo 5

#define STATUS_HEADER      0x5A
#define STATUS_PACKET_SIZE 10
#pragma pack(pop)

inline uint8_t calcChecksum(uint8_t header, const uint8_t* angles) {
  uint8_t s = header;
  for (int i = 0; i < 6; i++) s ^= angles[i];
  return s;
}

inline bool parseCommand(const uint8_t* data, size_t len, CommandPacket& out) {
  if (len != CMD_PACKET_SIZE)       return false;
  if (data[0] != CMD_HEADER)        return false;
  if (data[7] != calcChecksum(data[0], &data[1])) return false;
  out.header = data[0];
  memcpy(out.angles, &data[1], 6);
  out.checksum = data[7];
  return true;
}
