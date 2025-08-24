#ifndef SOIL_MOISTURE_SENSOR_H
#define SOIL_MOISTURE_SENSOR_H

#include <Arduino.h>

class SoilMoistureSensor {
private:
    int pin;
    int rawValue;
    int percentage;
    const int DRY_VALUE = 4095;    // 0% moisture (completely dry)
    const int WET_VALUE = 1600;    // 100% moisture (completely wet)

public:
    SoilMoistureSensor(int analogPin);
    bool readData();
    int getRawValue() const;
    int getPercentage() const;
    int convertToPercentage(int rawValue);
    void printDebugInfo() const;
    bool isValidReading() const;
};

#endif
