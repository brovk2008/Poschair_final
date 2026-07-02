#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <Arduino.h>

#define CMD_HEADER 0xA5
#define STATUS_HEADER 0x5A

// Command packet structure (packed to ensure exact 8 bytes memory footprint)
#pragma pack(push, 1)
struct CommandPacket {
    uint8_t header;         // 0xA5
    uint8_t target_angles[6]; // 0-180 for each of the 6 servos
    uint8_t checksum;       // XOR of header + target_angles
};

// Status packet structure (packed to ensure exact 10 bytes memory footprint)
struct StatusPacket {
    uint8_t header;         // 0x5A
    uint8_t status_flags;   // Bit flags: Bit 0 = BLE Connected, Bit 1 = Watchdog Failsafe Active
    uint8_t battery_msb;    // Battery voltage MSB (big-endian uint16)
    uint8_t battery_lsb;    // Battery voltage LSB (big-endian uint16)
    uint8_t current_angles[6]; // Real-time interpolated angles
};
#pragma pack(pop)

// Helper function to calculate XOR checksum of a byte array
inline uint8_t calculate_checksum(const uint8_t* buffer, size_t length) {
    uint8_t checksum = 0;
    for (size_t i = 0; i < length; i++) {
        checksum ^= buffer[i];
    }
    return checksum;
}

#endif // PROTOCOL_H
