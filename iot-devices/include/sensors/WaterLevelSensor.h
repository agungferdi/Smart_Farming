#ifndef WATER_LEVEL_SENSOR_H
#define WATER_LEVEL_SENSOR_H

#include <Arduino.h>

class WaterLevelSensor {
private:
    int pin;
    int rawValue;
    String status;
    // Calibration thresholds moved to SensorCalibration.h/cpp

public:
    WaterLevelSensor(int analogPin);
    bool readData();
    int getRawValue() const;
    String getStatus() const;
    String determineStatus(int rawValue);
    void printDebugInfo() const;
    bool isValidReading() const;
};

#endif