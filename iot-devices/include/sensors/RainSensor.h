#ifndef RAIN_SENSOR_H
#define RAIN_SENSOR_H

#include <Arduino.h>

class RainSensor {
private:
    int pin;
    bool rainDetected;

public:
    RainSensor(int digitalPin);
    void begin();
    bool readData();
    bool isRainDetected() const;
    void printDebugInfo() const;
};

#endif
