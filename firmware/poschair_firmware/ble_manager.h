#ifndef BLE_MANAGER_H
#define BLE_MANAGER_H

#include <Arduino.h>
#include <NimBLEDevice.h>
#include "config.h"
#include "protocol.h"
#include "servo_controller.h"

class BLEManager {
public:
    BLEManager(ServoController& servo_ctrl);
    
    // Initialize BLE, start advertising
    bool begin();
    
    // Send status notification to connected client
    void notifyStatus(const StatusPacket& packet);
    
    // Check if a client is currently connected
    bool isConnected() const;
    
    // Reset/update the last command received timestamp
    void resetFailsafeTimer();
    
    // Returns milliseconds since last valid command was received
    uint32_t msSinceLastCommand() const;

private:
    ServoController& _servo_ctrl;
    BLEServer* _server;
    BLECharacteristic* _tx_char; // Notify characteristic
    BLECharacteristic* _rx_char; // Write characteristic
    
    bool _is_connected;
    uint32_t _last_command_time;
    
    class ServerCallbacks : public BLEServerCallbacks {
    public:
        ServerCallbacks(BLEManager& manager);
        void onConnect(BLEServer* pServer) override;
        void onDisconnect(BLEServer* pServer) override;
    private:
        BLEManager& _manager;
    };
    
    class CommandCallbacks : public BLECharacteristicCallbacks {
    public:
        CommandCallbacks(BLEManager& manager);
        void onWrite(BLECharacteristic* pCharacteristic) override;
    private:
        BLEManager& _manager;
    };
};

#endif // BLE_MANAGER_H
