#include "sensors/SoilTemperatureSensor.h"

const float SoilTemperatureSensor::MIN_SOIL_TEMP = -20.0;
const float SoilTemperatureSensor::MAX_SOIL_TEMP = 60.0;

SoilTemperatureSensor::SoilTemperatureSensor(int sensorPin) 
    : pin(sensorPin), oneWire(sensorPin), sensors(&oneWire) {
    temperature = 0.0;
    dataValid = false;
    lastReadTime = 0;
}

void SoilTemperatureSensor::begin() {
    sensors.begin();
    
    int deviceCount = sensors.getDeviceCount();
    Serial.printf("DS18B20 Soil Temperature Sensor initialized on GPIO%d\n", pin);
    Serial.printf("Found %d DS18B20 device(s)\n", deviceCount);
    
    if (deviceCount == 0) {
        Serial.println("Warning: No DS18B20 sensors found! Check wiring.");
    } else {
        sensors.setResolution(12);
        Serial.println("DS18B20 resolution set to 12-bit (0.0625°C precision)");
    }
}

bool SoilTemperatureSensor::readData() {
    unsigned long currentTime = millis();
    
    if (currentTime - lastReadTime < READ_INTERVAL) {
        return dataValid;
    }
    
    sensors.requestTemperatures();
    float tempReading = sensors.getTempCByIndex(0);
    
    if (validateReading(tempReading)) {
        temperature = tempReading;
        dataValid = true;
        lastReadTime = currentTime;
        return true;
    } else {
        dataValid = false;
        Serial.println("Invalid soil temperature reading");
        return false;
    }
}

float SoilTemperatureSensor::getTemperature() const {
    return temperature;
}

bool SoilTemperatureSensor::isDataValid() const {
    return dataValid;
}

bool SoilTemperatureSensor::validateReading(float temp) {
    if (temp == DEVICE_DISCONNECTED_C) {
        Serial.println("DS18B20 sensor disconnected");
        return false;
    }
    
    if (temp < MIN_SOIL_TEMP || temp > MAX_SOIL_TEMP) {
        Serial.printf("Unusual soil temperature: %.2f°C\n", temp);
    }
    
    return true;
}

void SoilTemperatureSensor::printDebugInfo() const {
    Serial.printf("Soil Temperature: %.2f°C\n", temperature);
}
