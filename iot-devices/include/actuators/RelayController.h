#ifndef RELAY_CONTROLLER_H
#define RELAY_CONTROLLER_H

#include <Arduino.h>

class RelayController {
private:
    int pin;
    bool isActive;
    bool lastState;
    const int SOIL_THRESHOLD = 20;       // 0-20% soil moisture triggers pump
    const float TEMP_THRESHOLD = 33.0;   // Temperature must be >= 33°C

public:
    RelayController(int relayPin);
    void begin();
    bool shouldActivate(int soilMoisture, float temperature);
    void control(int soilMoisture, float temperature, String& reason);
    bool isRelayActive() const;
    bool hasStateChanged();
    void updateLastState();
    void printDebugInfo(const String& reason) const;
};

#endif
