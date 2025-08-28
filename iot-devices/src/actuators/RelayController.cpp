#include "actuators/RelayController.h"

RelayController::RelayController(int relayPin) : pin(relayPin) {
    isActive = false;
    lastState = false;
}

void RelayController::begin() {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);  // Start with relay OFF (HIGH = OFF for low-triggered relay)
    isActive = false;
    lastState = false;
    Serial.printf("Relay controller initialized on GPIO%d\n", pin);
}

bool RelayController::shouldActivate(int soilMoisture) {
    return (soilMoisture <= SOIL_THRESHOLD);  // Only check soil moisture
}

void RelayController::control(int soilMoisture, String& reason) {
    bool shouldActivate = this->shouldActivate(soilMoisture);
    
    if (shouldActivate) {
        reason = "Low soil moisture detected (" + String(soilMoisture) + "%)";
    } else {
        reason = "Soil moisture sufficient (" + String(soilMoisture) + "%)";
    }
    
    // Update relay state - LOW-triggered relay (LOW = ON, HIGH = OFF)
    isActive = shouldActivate;
    digitalWrite(pin, isActive ? LOW : HIGH);  // LOW = ON, HIGH = OFF for low-triggered relay
}

bool RelayController::isRelayActive() const {
    return isActive;
}

bool RelayController::hasStateChanged() {
    return (isActive != lastState);
}

void RelayController::updateLastState() {
    lastState = isActive;
}

void RelayController::printDebugInfo(const String& reason) const {
    String status = isActive ? "ACTIVATED" : "DEACTIVATED";
    Serial.println("=== WATER PUMP " + status + " ===");
    Serial.println("Reason: " + reason);
    Serial.printf("Relay Pin (GPIO%d) set to: %s\n", pin, isActive ? "LOW (ON)" : "HIGH (OFF)");
    Serial.printf("Expected LED behavior: %s\n", isActive ? "LED OFF (pump running)" : "LED ON (pump stopped)");
}