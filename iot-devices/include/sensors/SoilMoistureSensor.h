#ifndef SOIL_MOISTURE_SENSOR_H
#define SOIL_MOISTURE_SENSOR_H

#include <Arduino.h>

class SoilMoistureSensor {
private:
    int pin;
    int rawValue;
    int percentage;
    

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