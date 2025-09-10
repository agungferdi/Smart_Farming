#ifndef SENSOR_CALIBRATION_H
#define SENSOR_CALIBRATION_H

#include <Arduino.h>

// GPIO Pin Definitions
namespace Pins {
    const int DHT11_PIN = 16;          // GPIO16 (safe with WiFi)
    const int SOIL_MOISTURE_PIN = 35;  // GPIO35 (ADC1 - safe with WiFi)
    const int SOIL_TEMP_PIN = 4;      // GPIO4 for DS18B20 soil temperature sensor
    const int RELAY_PIN = 17;          // GPIO17 for relay control
    const int RAIN_SENSOR_PIN = 18;    // GPIO18 for digital rain detection
    const int WATER_LEVEL_PIN = 34;    // GPIO34 for water level sensor (analog - ADC capable)
    const int SDA_PIN = 21;            // SDA pin for OLED
    const int SCL_PIN = 22;            // SCL pin for OLED
}

// DHT11 Configuration
namespace DHT11Config {
    const int DHT_TYPE = 11;           // DHT11 sensor type
}

// DS18B20 Soil Temperature Configuration
namespace DS18B20Config {
    const int RESOLUTION_BITS = 12;    // 12-bit resolution (0.0625°C precision)
    const unsigned long CONVERSION_TIME = 750; // 750ms for 12-bit conversion
}

// Soil Moisture Sensor Calibration
namespace SoilMoistureCalibration {
    extern const int DRY_VALUE;    // 0% moisture (completely dry)
    extern const int WET_VALUE;    // 100% moisture (completely wet)
    
    // Convert raw soil moisture value to percentage
    int convertToPercentage(int rawValue);
}

// Water Level Sensor Calibration
namespace WaterLevelCalibration {
    const int DRY_VALUE = 0;          // Sensor value when dry (no water)
    const int WET_VALUE = 1050;       // Sensor value when sensor is fully submerged
    const int SENSOR_HEIGHT_CM = 5;   // Actual height of your sensor in cm
    
    extern const int LOW_THRESHOLD;     // Below this = Low
    extern const int MEDIUM_THRESHOLD;  // Below this = Medium, above = High
    
    // Determine water level status based on raw value
    String determineStatus(int rawValue);
}

// Relay Control Thresholds
namespace RelayThresholds {
    const int SOIL_MOISTURE_THRESHOLD = 20;   // 0-20% soil moisture triggers pump
    // Removed temperature threshold since we only use soil moisture now
}

// Timing Configuration
namespace Timing {
    const unsigned long SENSOR_INTERVAL = 2000;  // Read sensor every 2 seconds
    const unsigned long SEND_INTERVAL = 300000;  // Send data every 5 minutes
}

// Utility functions for validation and debugging
namespace CalibrationUtils {
    bool validateSoilMoistureReading(int rawValue);
    bool validateWaterLevelReading(int rawValue);
    bool validateTemperatureReading(float temperature);
    bool validateSoilTemperatureReading(float temperature);
    bool validateHumidityReading(float humidity);
    void printCalibrationInfo();
    void printSensorReadings(int soilRaw, int soilPercent, int waterRaw, String waterStatus, float soilTemp);
}

#endif