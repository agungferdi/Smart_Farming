#include "utils/SensorCalibration.h"

// Soil Moisture Sensor Calibration Values
namespace SoilMoistureCalibration {
    const int DRY_VALUE = 2945;    // 0% moisture (completely dry)
    const int WET_VALUE = 1390;    // 100% moisture (completely wet)
    
    int convertToPercentage(int rawValue) {
        // Convert raw soil moisture value to percentage
        // 4095 (dry) = 0% moisture, 1600 (wet) = 100% moisture
        // Lower values = more wet, Higher values = more dry
        
        // Handle extreme cases
        if (rawValue >= DRY_VALUE) return 0;    // Completely dry (0% moisture)
        if (rawValue <= WET_VALUE) return 100;  // Completely wet (100% moisture)
        
        // Map the value between dry and wet points: 4095->0%, 1600->100%
        // Formula: percentage = 100 * (DRY_VALUE - rawValue) / (DRY_VALUE - WET_VALUE)
        int percentage = 100 * (DRY_VALUE - rawValue) / (DRY_VALUE - WET_VALUE);
        
        return percentage;
    }
}

// Water Level Sensor Calibration Values
namespace WaterLevelCalibration {
    const int LOW_THRESHOLD = 350;     // Below this = Low
    const int MEDIUM_THRESHOLD = 400;  // Below this = Medium, above = High
    
    String determineStatus(int rawValue) {
        // Determine water level status based on raw value
        if (rawValue < LOW_THRESHOLD) {
            return "Low";
        } else if (rawValue < MEDIUM_THRESHOLD) {
            return "Medium";
        } else {
            return "High";
        }
    }
}

// Validation utility functions
namespace CalibrationUtils {
    
    bool validateSoilMoistureReading(int rawValue) {
        return (rawValue >= 0 && rawValue <= 4095);
    }
    
    bool validateWaterLevelReading(int rawValue) {
        return (rawValue >= 0 && rawValue <= 4095);
    }
    
    bool validateTemperatureReading(float temperature) {
        return (temperature >= -40.0 && temperature <= 80.0);  // DHT11 range
    }
    
    bool validateSoilTemperatureReading(float temperature) {
        return (temperature >= -55.0 && temperature <= 125.0);  // DS18B20 range
    }
    
    bool validateHumidityReading(float humidity) {
        return (humidity >= 0.0 && humidity <= 100.0);
    }
    
    void printCalibrationInfo() {
        Serial.println("=== SENSOR CALIBRATION INFO ===");
        Serial.println("GPIO Pin Configuration:");
        Serial.printf("  DHT11 Pin: %d\n", Pins::DHT11_PIN);
        Serial.printf("  Soil Moisture Pin: %d\n", Pins::SOIL_MOISTURE_PIN);
        Serial.printf("  Soil Temperature Pin: %d (DS18B20)\n", Pins::SOIL_TEMP_PIN);
        Serial.printf("  Rain Sensor Pin: %d\n", Pins::RAIN_SENSOR_PIN);
        Serial.printf("  Water Level Pin: %d\n", Pins::WATER_LEVEL_PIN);
        Serial.printf("  Relay Pin: %d\n", Pins::RELAY_PIN);
        Serial.printf("  OLED SDA Pin: %d\n", Pins::SDA_PIN);
        Serial.printf("  OLED SCL Pin: %d\n", Pins::SCL_PIN);
        Serial.println("Soil Moisture Calibration:");
        Serial.printf("  Dry Value (0%% moisture): %d\n", SoilMoistureCalibration::DRY_VALUE);
        Serial.printf("  Wet Value (100%% moisture): %d\n", SoilMoistureCalibration::WET_VALUE);
        Serial.println("DS18B20 Soil Temperature Configuration:");
        Serial.printf("  Resolution: %d-bit (0.0625°C precision)\n", DS18B20Config::RESOLUTION_BITS);
        Serial.printf("  Conversion Time: %lu ms\n", DS18B20Config::CONVERSION_TIME);
        Serial.println("Water Level Calibration:");
        Serial.printf("  Dry Value: %d\n", WaterLevelCalibration::DRY_VALUE);
        Serial.printf("  Wet Value: %d\n", WaterLevelCalibration::WET_VALUE);
        Serial.printf("  Sensor Height: %d cm\n", WaterLevelCalibration::SENSOR_HEIGHT_CM);
        Serial.printf("  Low Threshold: %d\n", WaterLevelCalibration::LOW_THRESHOLD);
        Serial.printf("  Medium Threshold: %d\n", WaterLevelCalibration::MEDIUM_THRESHOLD);
        Serial.println("Relay Control Thresholds:");
        Serial.printf("  Soil Moisture Threshold: %d%%\n", RelayThresholds::SOIL_MOISTURE_THRESHOLD);
        Serial.println("Timing Configuration:");
        Serial.printf("  Sensor Reading Interval: %lu ms\n", Timing::SENSOR_INTERVAL);
        Serial.printf("  Data Send Interval: %lu ms\n", Timing::SEND_INTERVAL);
        Serial.println("==============================");
    }
    
    void printSensorReadings(int soilRaw, int soilPercent, int waterRaw, String waterStatus, float soilTemp) {
        Serial.println("=== CURRENT SENSOR READINGS ===");
        Serial.printf("Soil Moisture: %d raw -> %d%% moisture\n", soilRaw, soilPercent);
        Serial.printf("Soil Temperature: %.2f°C\n", soilTemp);
        Serial.printf("Water Level: %d raw -> %s\n", waterRaw, waterStatus.c_str());
        Serial.println("===============================");
    }
}