#ifndef SOIL_TEMPERATURE_SENSOR_H
#define SOIL_TEMPERATURE_SENSOR_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

class SoilTemperatureSensor {
private:
    int pin;
    OneWire oneWire;
    DallasTemperature sensors;
    float temperature;
    bool dataValid;
    unsigned long lastReadTime;
    static const unsigned long READ_INTERVAL = 750; // DS18B20 conversion time
    
    bool validateReading(float temp);
    
public:
    SoilTemperatureSensor(int sensorPin);
    void begin();
    bool readData();
    float getTemperature() const;
    bool isDataValid() const;
    void printDebugInfo() const;
    
    // Static validation constants
    static const float MIN_SOIL_TEMP;
    static const float MAX_SOIL_TEMP;
};

#endif

