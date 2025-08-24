#include "sensors/DHT11Sensor.h"
#include <Arduino.h>

DHT11Sensor::DHT11Sensor(int dhtPin, int dhtType) : dht(dhtPin, dhtType), pin(dhtPin) {
    temperature = 0.0;
    humidity = 0.0;
    dataValid = false;
}

void DHT11Sensor::begin() {
    dht.begin();
    Serial.println("DHT11 sensor initialized");
}

bool DHT11Sensor::readData() {
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    
    if (isnan(h) || isnan(t)) {
        Serial.println("Failed to read from DHT sensor!");
        dataValid = false;
        return false;
    }
    
    temperature = t;
    humidity = h;
    dataValid = true;
    return true;
}

float DHT11Sensor::getTemperature() const {
    return temperature;
}

float DHT11Sensor::getHumidity() const {
    return humidity;
}

bool DHT11Sensor::isDataValid() const {
    return dataValid;
}

void DHT11Sensor::printDebugInfo() const {
    if (dataValid) {
        Serial.printf("DHT11 - Temperature: %.2f°C, Humidity: %.2f%%\n", temperature, humidity);
    } else {
        Serial.println("DHT11 - Invalid data");
    }
}
