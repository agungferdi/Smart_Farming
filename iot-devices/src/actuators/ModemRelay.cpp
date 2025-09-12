#include "actuators/ModemRelay.h"

ModemRelay::ModemRelay(int relayPin) : pin(relayPin), isActive(false) {
}

void ModemRelay::begin() {
    pinMode(pin, OUTPUT);
    turnOn();  
    Serial.printf("Modem relay initialized on GPIO%d and activated\n", pin);
}

void ModemRelay::turnOn() {
    isActive = true;
    digitalWrite(pin, LOW);  
}

void ModemRelay::turnOff() {
    isActive = false;
    digitalWrite(pin, HIGH);  
}

bool ModemRelay::isRelayActive() const {
    return isActive;
}
