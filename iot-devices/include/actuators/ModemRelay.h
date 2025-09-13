#ifndef MODEM_RELAY_H
#define MODEM_RELAY_H

#include <Arduino.h>

class ModemRelay {
private:
    int pin;
    bool isActive;

public:
    ModemRelay(int relayPin);
    void begin();
    void turnOn();
    void turnOff();
    bool isRelayActive() const;
};

#endif
