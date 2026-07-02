#include "ble_manager.h"

BLEManager::BLEManager(ServoController& servo_ctrl) 
    : _servo_ctrl(servo_ctrl), _server(nullptr), _tx_char(nullptr), _rx_char(nullptr), 
      _is_connected(false), _last_command_time(0) {}

bool BLEManager::begin() {
    // Initialize NimBLE Device
    NimBLEDevice::init(DEVICE_NAME);
    
    // Increase power for better BLE range
    NimBLEDevice::setPower(ESP_PWR_LVL_P9); // Max Tx power

    // Create Server
    _server = NimBLEDevice::createServer();
    _server->setCallbacks(new ServerCallbacks(*this));

    // Create Service
    BLEService* service = _server->createService(SERVICE_UUID);

    // Create Tx/Notify Characteristic (Status)
    _tx_char = service->createCharacteristic(
        CHARACTERISTIC_UUID_TX,
        NIMBLE_PROPERTY::NOTIFY
    );

    // Create Rx/Write Characteristic (Command)
    _rx_char = service->createCharacteristic(
        CHARACTERISTIC_UUID_RX,
        NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
    );
    _rx_char->setCallbacks(new CommandCallbacks(*this));

    // Start Service
    service->start();

    // Start Advertising
    BLEAdvertising* advertising = NimBLEDevice::getAdvertising();
    advertising->addServiceUUID(SERVICE_UUID);
    advertising->setScanResponse(true);
    advertising->setMinPreferred(0x06);  // iOS optimization helper
    advertising->setMaxPreferred(0x12);
    advertising->start();

    _last_command_time = millis(); // Initialize watchdog timer

    Serial.println("NimBLE initialized and advertising started.");
    return true;
}

void BLEManager::notifyStatus(const StatusPacket& packet) {
    if (_is_connected && _tx_char != nullptr) {
        _tx_char->setValue((uint8_t*)&packet, sizeof(StatusPacket));
        _tx_char->notify();
    }
}

bool BLEManager::isConnected() const {
    return _is_connected;
}

void BLEManager::resetFailsafeTimer() {
    _last_command_time = millis();
}

uint32_t BLEManager::msSinceLastCommand() const {
    return millis() - _last_command_time;
}

// Server Callbacks
BLEManager::ServerCallbacks::ServerCallbacks(BLEManager& manager) : _manager(manager) {}

void BLEManager::ServerCallbacks::onConnect(BLEServer* pServer) {
    _manager._is_connected = true;
    _manager.resetFailsafeTimer(); // Prevent immediate failsafe on connection
    Serial.println("Client connected!");
}

void BLEManager::ServerCallbacks::onDisconnect(BLEServer* pServer) {
    _manager._is_connected = false;
    Serial.println("Client disconnected. Restarting advertising...");
    NimBLEDevice::startAdvertising();
}

// Characteristic Write Callbacks
BLEManager::CommandCallbacks::CommandCallbacks(BLEManager& manager) : _manager(manager) {}

void BLEManager::CommandCallbacks::onWrite(BLECharacteristic* pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    
    if (value.length() == sizeof(CommandPacket)) {
        const uint8_t* raw_data = (const uint8_t*)value.data();
        
        // Extract and validate packet
        const CommandPacket* cmd = (const CommandPacket*)raw_data;
        
        if (cmd->header == CMD_HEADER) {
            // Validate checksum (XOR of bytes 0 to 6)
            uint8_t calculated = calculate_checksum(raw_data, 7);
            
            if (calculated == cmd->checksum) {
                // Command verified! Update servos
                _manager._servo_ctrl.setTargetAngles(cmd->target_angles);
                _manager.resetFailsafeTimer();
                
                Serial.printf("Cmd rx: [%d, %d, %d, %d, %d, %d]\n",
                              cmd->target_angles[0], cmd->target_angles[1], cmd->target_angles[2],
                              cmd->target_angles[3], cmd->target_angles[4], cmd->target_angles[5]);
            } else {
                Serial.printf("Checksum mismatch: rx 0x%02X, calc 0x%02X\n", cmd->checksum, calculated);
            }
        } else {
            Serial.printf("Invalid command header: 0x%02X\n", cmd->header);
        }
    } else {
        Serial.printf("Invalid command packet length: %d bytes (expected %d)\n", value.length(), sizeof(CommandPacket));
    }
}
