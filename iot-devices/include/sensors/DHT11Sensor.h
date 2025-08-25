#ifndef DHT11_SENSOR_H
#define DHT11_SENSOR_H

#include <DHT.h>

class DHT11Sensor {
private:
    DHT dht;
    int pin;
    float temperature;
    float humidity;
    bool dataValid;

public:
    DHT11Sensor(int dhtPin, int dhtType);
    void begin();
    bool readData();
    float getTemperature() const;
    float getHumidity() const;
    bool isDataValid() const;
    void printDebugInfo() const;
};

#endif
