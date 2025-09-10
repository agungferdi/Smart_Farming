#include "sensors/SoilTemperatureSensor.h"

// Static constants
const float SoilTemperatureSensor::MIN_VALID_TEMP = -55.0; // DS18B20 minimum
const float SoilTemperatureSensor::MAX_VALID_TEMP = 125.0; // DS18B20 maximum

SoilTemperatureSensor::SoilTemperatureSensor(int sensorPin) 
    : pin(sensorPin), oneWire(sensorPin), sensors(&oneWire) {
    temperature = 0.0;
    dataValid = false;
    lastReadTime = 0;
}

void SoilTemperatureSensor::begin() {
    sensors.begin();
    
    // Check if sensor is connected
    int deviceCount = sensors.getDeviceCount();
    Serial.printf("DS18B20 Soil Temperature Sensor initialized on GPIO%d\n", pin);
    Serial.printf("Found %d DS18B20 device(s)\n", deviceCount);
    
    if (deviceCount == 0) {
        Serial.println("Warning: No DS18B20 sensors found! Check wiring.");
    } else {
        // Set resolution to 12-bit (0.0625°C precision)
        sensors.setResolution(12);
        Serial.println("DS18B20 resolution set to 12-bit (0.0625°C precision)");
    }
}

bool SoilTemperatureSensor::readData() {
    unsigned long currentTime = millis();
    
    // Check if enough time has passed since last reading
    if (currentTime - lastReadTime < READ_INTERVAL) {
        return dataValid; // Return previous reading validity
    }
    
    // Request temperature conversion
    sensors.requestTemperatures();
    
    // Get temperature (index 0 = first sensor)
    float tempReading = sensors.getTempCByIndex(0);
    
    // Validate reading
    if (validateReading(tempReading)) {
        temperature = tempReading;
        dataValid = true;
        lastReadTime = currentTime;
        return true;
    } else {
        dataValid = false;
        Serial.println("❌ Invalid soil temperature reading");
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
    // Check for DS18B20 error codes
    if (temp == DEVICE_DISCONNECTED_C) {
        Serial.println("❌ DS18B20 sensor disconnected");
        return false;
    }
    
    // Check if temperature is within valid range
    if (temp < MIN_VALID_TEMP || temp > MAX_VALID_TEMP) {
        Serial.printf("❌ Soil temperature out of range: %.2f°C\n", temp);
        return false;
    }
    
    // Additional sanity check for typical soil temperatures
    if (temp < -20.0 || temp > 60.0) {
        Serial.printf("⚠️  Unusual soil temperature: %.2f°C\n", temp);
        // Don't return false, just warn - could be legitimate in extreme conditions
    }
    
    return true;
}

void SoilTemperatureSensor::printDebugInfo() const {
    Serial.println("=== DS18B20 Soil Temperature Sensor ===");
    Serial.printf("Pin: GPIO%d\n", pin);
    Serial.printf("Temperature: %.2f°C\n", temperature);
    Serial.printf("Data Valid: %s\n", dataValid ? "✓ Yes" : "❌ No");
    Serial.printf("Precision: 0.0625°C (12-bit)\n");
    
    if (dataValid) {
        // Provide soil temperature context
        if (temperature < 10.0) {
            Serial.println("Status: Cold soil - plant growth may be slow");
        } else if (temperature < 20.0) {
            Serial.println("Status: Cool soil - moderate growth conditions");
        } else if (temperature < 30.0) {
            Serial.println("Status: Warm soil - optimal for most plants");
        } else if (temperature < 40.0) {
            Serial.println("Status: Hot soil - may stress some plants");
        } else {
            Serial.println("Status: Very hot soil - potential plant damage");
        }
    }
    Serial.println("=====================================");
}
