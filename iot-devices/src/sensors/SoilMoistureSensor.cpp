#include "sensors/SoilMoistureSensor.h"

SoilMoistureSensor::SoilMoistureSensor(int analogPin) : pin(analogPin) {
    rawValue = 0;
    percentage = 0;
}

bool SoilMoistureSensor::readData() {
    rawValue = analogRead(pin);
    percentage = convertToPercentage(rawValue);
    return isValidReading();
}

int SoilMoistureSensor::getRawValue() const {
    return rawValue;
}

int SoilMoistureSensor::getPercentage() const {
    return percentage;
}

int SoilMoistureSensor::convertToPercentage(int rawValue) {
    // Convert raw soil moisture value to percentage
    // 4095 (dry) = 0% moisture, 1600 (wet) = 100% moisture
    // Lower values = more wet, Higher values = more dry
    
    // Handle extreme cases
    if (rawValue >= DRY_VALUE) return 0;    // Completely dry (0% moisture)
    if (rawValue <= WET_VALUE) return 100;  // Completely wet (100% moisture)
    
    // Map the value between dry and wet points: 4095->0%, 1600->100%
    // Formula: percentage = 100 * (DRY_VALUE - rawValue) / (DRY_VALUE - WET_VALUE)
    int percentage = 100 * (DRY_VALUE - rawValue) / (DRY_VALUE - WET_VALUE);
    
    return percentage;
}

void SoilMoistureSensor::printDebugInfo() const {
    Serial.printf("DEBUG: Soil Moisture GPIO%d = %d (%d%% moisture)\n", pin, rawValue, percentage);
}

bool SoilMoistureSensor::isValidReading() const {
    return (rawValue >= 0 && rawValue <= 4095);
}
