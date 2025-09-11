#include "sensors/WaterLevelSensor.h"
#include "utils/SensorCalibration.h"

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
    return WaterLevelCalibration::determineStatus(rawValue);
}

void WaterLevelSensor::printDebugInfo() const {
    Serial.printf("Water Level - Raw Value: %d | Status: %s\n", rawValue, status.c_str());
}

bool WaterLevelSensor::isValidReading() const {
    return CalibrationUtils::validateWaterLevelReading(rawValue);
}