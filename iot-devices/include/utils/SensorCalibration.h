#ifndef SENSOR_CALIBRATION_H
#define SENSOR_CALIBRATION_H

#include <Arduino.h>

// GPIO Pin Definitions
namespace Pins {
    const int DHT11_PIN = 16;          // GPIO16 (safe with WiFi)
    const int SOIL_MOISTURE_PIN = 35;  // GPIO35 (ADC1 - safe with WiFi)
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
    const float TEMPERATURE_THRESHOLD = 33.0; // Temperature must be >= 33°C
}

// Timing Configuration
namespace Timing {
    const unsigned long SENSOR_INTERVAL = 2000;  // Read sensor every 2 seconds
    const unsigned long SEND_INTERVAL = 15000;   // Send data every 15 seconds
}

// Utility functions for validation and debugging
namespace CalibrationUtils {
    bool validateSoilMoistureReading(int rawValue);
    bool validateWaterLevelReading(int rawValue);
    bool validateTemperatureReading(float temperature);
    bool validateHumidityReading(float humidity);
    void printCalibrationInfo();
    void printSensorReadings(int soilRaw, int soilPercent, int waterRaw, String waterStatus);
}

#endif