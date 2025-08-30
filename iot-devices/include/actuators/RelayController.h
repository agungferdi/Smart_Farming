#ifndef RELAY_CONTROLLER_H
#define RELAY_CONTROLLER_H

#include <Arduino.h>

class RelayController {
private:
    int pin;
    bool isActive;
    bool lastState;
    const int SOIL_THRESHOLD = 20;       // 0-20% soil moisture triggers pump
    // Removed temperature threshold since we only use soil moisture now

public:
    RelayController(int relayPin);
    void begin();
    bool shouldActivate(int soilMoisture);  // Only soil moisture parameter now
    void control(int soilMoisture, String& reason);  // Simplified parameters
    void setRelayState(bool state);  // Manual relay control
    bool isRelayActive() const;
    bool hasStateChanged();
    void updateLastState();
    void printDebugInfo(const String& reason) const;
};

#endif