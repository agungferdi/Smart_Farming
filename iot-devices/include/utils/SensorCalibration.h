#ifndef SENSOR_CALIBRATION_H
#define SENSOR_CALIBRATION_H

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

// Soil Moisture Calibration
namespace SoilMoistureCalibration {
    const int DRY_VALUE = 4095;       // 0% moisture (completely dry)
    const int WET_VALUE = 1600;       // 100% moisture (completely wet)
}

// Water Level Calibration
namespace WaterLevelCalibration {
    const int DRY_VALUE = 0;          // Sensor value when dry (no water)
    const int WET_VALUE = 1050;       // Sensor value when sensor is fully submerged
    const int SENSOR_HEIGHT_CM = 5;   // Actual height of your sensor in cm
    
    // Status thresholds
    const int LOW_THRESHOLD = 350;     // Below this = Low
    const int MEDIUM_THRESHOLD = 400;  // Between 350-399 = Medium, 400+ = High
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

#endif
