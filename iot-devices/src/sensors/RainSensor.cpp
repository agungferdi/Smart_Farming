#include "sensors/RainSensor.h"

RainSensor::RainSensor(int digitalPin) : pin(digitalPin) {
    rainDetected = false;
}

void RainSensor::begin() {
    pinMode(pin, INPUT);
    Serial.printf("Rain sensor initialized on GPIO%d\n", pin);
}

bool RainSensor::readData() {
    // Read the digital pin from MH-RD rain sensor
    // MH-RD typically: LOW = rain detected, HIGH = no rain
    int digitalValue = digitalRead(pin);
    
    // Convert to boolean (invert logic since LOW = rain)
    rainDetected = (digitalValue == LOW);
    
    return true;
}

bool RainSensor::isRainDetected() const {
    return rainDetected;
}

void RainSensor::printDebugInfo() const {
    int digitalValue = digitalRead(pin);
    Serial.printf("DEBUG: Rain sensor GPIO%d = %d (Rain: %s)\n", 
                  pin, digitalValue, rainDetected ? "true" : "false");
}
