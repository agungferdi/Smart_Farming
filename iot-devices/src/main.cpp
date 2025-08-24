#include <Arduino.h>
#include "config.h"
#include "utils/SensorCalibration.h"
#include "sensors/DHT11Sensor.h"
#include "sensors/SoilMoistureSensor.h"
#include "sensors/RainSensor.h"
#include "sensors/WaterLevelSensor.h"
#include "actuators/RelayController.h"
#include "display/OLEDDisplay.h"
#include "network/DataUploader.h"

// Function declarations
void initializeComponents();
bool readAllSensors();
void controlPump();
void updateDisplay();
void sendDataToCloud();
void testSensors();

// Initialize components using calibration constants
DHT11Sensor dht11(Pins::DHT11_PIN, DHT11Config::DHT_TYPE);
SoilMoistureSensor soilSensor(Pins::SOIL_MOISTURE_PIN);
RainSensor rainSensor(Pins::RAIN_SENSOR_PIN);
WaterLevelSensor waterSensor(Pins::WATER_LEVEL_PIN);
RelayController relay(Pins::RELAY_PIN);
OLEDDisplay oled(Pins::SDA_PIN, Pins::SCL_PIN);
DataUploader uploader(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSent = 0;

// Sensor data validation
bool sensorDataValid = false;

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("=== Smart Irrigation System with Rain Detection ===");
    
    // Initialize all components
    initializeComponents();
    
    // Connect to WiFi
    uploader.connectWiFi(WIFI_SSID, WIFI_PASSWORD);
    
    // Test all sensors
    testSensors();
    
    Serial.println("Smart Irrigation System Ready!");
}

void loop() {
    unsigned long currentTime = millis();
    
    // Read sensors every 2 seconds
    if (currentTime - lastSensorRead >= Timing::SENSOR_INTERVAL) {
        sensorDataValid = readAllSensors();
        
        if (sensorDataValid) {
            controlPump();
            updateDisplay();
        }
        
        lastSensorRead = currentTime;
    }
    
    // Send data every 15 seconds
    if (currentTime - lastDataSent >= Timing::SEND_INTERVAL) {
        if (sensorDataValid) {
            sendDataToCloud();
        }
        lastDataSent = currentTime;
    }
    
    delay(100);
}

void initializeComponents() {
    Serial.println("Initializing components...");
    
    // Initialize I2C first (critical for OLED)
    Wire.begin(Pins::SDA_PIN, Pins::SCL_PIN);
    delay(100);
    
    // Initialize OLED display first
    if (!oled.begin()) {
        Serial.println("OLED initialization failed!");
        Serial.println("Continuing without display...");
    }
    
    // Initialize other components
    dht11.begin();
    rainSensor.begin();
    relay.begin();
    
    // Print sensor configuration
    Serial.printf("DHT11 on GPIO%d, Soil moisture on GPIO%d, Relay on GPIO%d\n", 
                  Pins::DHT11_PIN, Pins::SOIL_MOISTURE_PIN, Pins::RELAY_PIN);
    Serial.printf("Rain sensor on GPIO%d, Water level on GPIO%d\n", 
                  Pins::RAIN_SENSOR_PIN, Pins::WATER_LEVEL_PIN);
    Serial.printf("OLED on SDA%d/SCL%d\n", Pins::SDA_PIN, Pins::SCL_PIN);
}

bool readAllSensors() {
    // Read all sensors
    bool dhtOk = dht11.readData();
    bool soilOk = soilSensor.readData();
    bool rainOk = rainSensor.readData();
    bool waterOk = waterSensor.readData();
    
    // Print debug information
    if (dhtOk) dht11.printDebugInfo();
    if (soilOk) soilSensor.printDebugInfo();
    if (rainOk) rainSensor.printDebugInfo();
    if (waterOk) waterSensor.printDebugInfo();
    
    // Validate all readings
    bool allValid = dhtOk && soilOk && rainOk && waterOk;
    
    if (allValid) {
        // Print summary
        Serial.printf("Summary - Temp: %.1f°C, Humid: %.1f%%, Soil: %d%%, Water: %s, Rain: %s\n",
                      dht11.getTemperature(), dht11.getHumidity(), 
                      soilSensor.getPercentage(), waterSensor.getStatus().c_str(),
                      rainSensor.isRainDetected() ? "true" : "false");
    } else {
        Serial.println("❌ Some sensor readings are invalid!");
    }
    
    return allValid;
}

void controlPump() {
    String reason;
    relay.control(soilSensor.getPercentage(), dht11.getTemperature(), reason);
    
    if (relay.hasStateChanged()) {
        relay.printDebugInfo(reason);
        
        // Send relay log to database
        uploader.sendRelayLog(relay.isRelayActive(), reason, 
                             soilSensor.getPercentage(), dht11.getTemperature(), 
                             rainSensor.isRainDetected());
        
        relay.updateLastState();
    }
}

void updateDisplay() {
    oled.updateSensorData(dht11.getTemperature(), dht11.getHumidity(),
                         soilSensor.getPercentage(), waterSensor.getStatus(),
                         rainSensor.isRainDetected(), relay.isRelayActive(),
                         uploader.isWiFiConnected());
}

void sendDataToCloud() {
    bool success = uploader.sendSensorData(dht11.getTemperature(), dht11.getHumidity(),
                                          soilSensor.getPercentage(), rainSensor.isRainDetected(),
                                          waterSensor.getStatus());
    
    if (success) {
        Serial.println("✓ Sensor data sent to database");
    } else {
        Serial.println("✗ Failed to send sensor data");
    }
}

void testSensors() {
    Serial.println("Testing sensors...");
    
    // Test each sensor individually
    dht11.readData();
    soilSensor.readData();
    rainSensor.readData();
    waterSensor.readData();
    
    Serial.printf("Initial readings - Soil: %d, Rain: %s, Water: %d\n",
                  soilSensor.getRawValue(),
                  rainSensor.isRainDetected() ? "Rain detected" : "No rain",
                  waterSensor.getRawValue());
}
