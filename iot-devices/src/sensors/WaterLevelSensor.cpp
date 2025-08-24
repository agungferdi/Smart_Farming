#include "sensors/WaterLevelSensor.h"

WaterLevelSensor::WaterLevelSensor(int analogPin) : pin(analogPin) {
    rawValue = 0;
    status = "Low";
}

bool WaterLevelSensor::readData() {
    rawValue = analogRead(pin);
    status = determineStatus(rawValue);
    return isValidReading();
}

int WaterLevelSensor::getRawValue() const {
    return rawValue;
}

String WaterLevelSensor::getStatus() const {
    return status;
}

String WaterLevelSensor::determineStatus(int rawValue) {
    // Determine water level status based on raw value
    String status;
    if (rawValue < 350) {
        status = "Low";
    } else if (rawValue < 400) {
        status = "Medium";
    } else {
        status = "High";
    }
    
    return status;
}

void WaterLevelSensor::printDebugInfo() const {
    Serial.printf("Water Level - Raw Value: %d | Status: %s\n", rawValue, status.c_str());
}

bool WaterLevelSensor::isValidReading() const {
    return (rawValue >= 0 && rawValue <= 4095);
}
