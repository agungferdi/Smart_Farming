#include "sensors/SoilMoistureSensor.h"
#include "utils/SensorCalibration.h"

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
    // Use the centralized calibration function
    return SoilMoistureCalibration::convertToPercentage(rawValue);
}

void SoilMoistureSensor::printDebugInfo() const {
    Serial.printf("DEBUG: Soil Moisture GPIO%d = %d (%d%% moisture)\n", pin, rawValue, percentage);
}

bool SoilMoistureSensor::isValidReading() const {
    return CalibrationUtils::validateSoilMoistureReading(rawValue);
}