#include <Arduino.h>
#include "config.h"
#include "utils/SensorCalibration.h"
#include "sensors/DHT11Sensor.h"
#include "sensors/SoilMoistureSensor.h"
// #include "sensors/SoilTemperatureSensor.h"
#include "sensors/RainSensor.h"
#include "sensors/WaterLevelSensor.h"
#include "actuators/RelayController.h"
#include "display/OLEDDisplay.h"
#include "network/MQTTClient.h"  // Changed from DataUploader to MQTTClient

// Function declarations
void initializeComponents();
bool readAllSensors();
void controlPump();
void updateDisplay();
void sendDataToMQTT();  // Changed from sendDataToCloud
void testSensors();

// Initialize components using calibration constants
DHT11Sensor dht11(Pins::DHT11_PIN, DHT11Config::DHT_TYPE);
SoilMoistureSensor soilSensor(Pins::SOIL_MOISTURE_PIN); 
// SoilTemperatureSensor soilTempSensor(Pins::SOIL_TEMP_PIN);
RainSensor rainSensor(Pins::RAIN_SENSOR_PIN);
WaterLevelSensor waterSensor(Pins::WATER_LEVEL_PIN);
RelayController relay(Pins::RELAY_PIN);
OLEDDisplay oled(Pins::SDA_PIN, Pins::SCL_PIN);

// Initialize MQTT Client with HiveMQ Cloud settings
MQTTClient mqttClient(MQTT_SERVER, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, 
                      DEVICE_ID, MQTT_TOPIC_SENSOR_DATA, MQTT_TOPIC_RELAY_LOG, MQTT_TOPIC_STATUS, MQTT_TOPIC_RELAY_COMMAND);

// Global variables for remote relay control
bool remoteRelayCommand = false;
bool remoteRelayStatus = false;
String remoteRelayReason = "";
bool manualOverrideMode = false; 
// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSent = 0;

// Sensor data validation
bool sensorDataValid = false;

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("=== Smart Irrigation System with MQTT ===");
    
    initializeComponents();
    
    // Connect to WiFi and MQTT
    if (mqttClient.connectWiFi(WIFI_SSID, WIFI_PASSWORD)) {
        Serial.println("WiFi connected successfully!");
        
        if (mqttClient.connectMQTT()) {
            Serial.println("MQTT connected successfully!");
        } else {
            Serial.println("MQTT connection failed - will retry automatically");
        }
    } else {
        Serial.println("WiFi connection failed!");
    }

    testSensors();
    
    Serial.println("Smart Irrigation System Ready!");
}

void loop() {
    unsigned long currentTime = millis();
    
    // Handle MQTT connection and message processing
    mqttClient.loop();
    
    if (currentTime - lastSensorRead >= Timing::SENSOR_INTERVAL) {
        sensorDataValid = readAllSensors();
        
        if (sensorDataValid) {
            controlPump();
            updateDisplay();
        }
        
        lastSensorRead = currentTime;
    }
    
    if (currentTime - lastDataSent >= Timing::SEND_INTERVAL) {
        if (sensorDataValid) {
            sendDataToMQTT();  // Changed from sendDataToCloud
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
    // soilTempSensor.begin();
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

    bool dhtOk = dht11.readData();
    bool soilOk = soilSensor.readData();
    bool rainOk = rainSensor.readData();
    bool waterOk = waterSensor.readData();
    
    if (dhtOk) dht11.printDebugInfo();
    if (soilOk) soilSensor.printDebugInfo();

    if (rainOk) rainSensor.printDebugInfo();
    if (waterOk) waterSensor.printDebugInfo();
    
    bool allValid = dhtOk && soilOk && rainOk && waterOk;
    
    if (allValid) {
        String modeStatus = manualOverrideMode ? " [MANUAL OVERRIDE]" : " [AUTO MODE]";
        Serial.printf("Summary - Air: %.1f°C, Humid: %.1f%%, Soil: %d%%, Water: %s, Rain: %s%s\n",
                      dht11.getTemperature(), dht11.getHumidity(), 
                      soilSensor.getPercentage(),
                      waterSensor.getStatus().c_str(),
                      rainSensor.isRainDetected() ? "true" : "false",
                      modeStatus.c_str());
    } else {
        Serial.println("Some sensor readings are invalid!");
    }
    
    return allValid;
}

void controlPump() {
    String reason;
    bool relayTriggered = false;
    
    // Check for remote relay command first
    if (remoteRelayCommand) {
        Serial.printf("Processing remote relay command: %s\n", remoteRelayStatus ? "ON" : "OFF");
        
        if (remoteRelayStatus) {
            manualOverrideMode = true;
            relay.setRelayState(true);
            reason = remoteRelayReason + " (Manual Override Mode)";
            Serial.println("🔒 Manual Override Mode ACTIVATED - Relay will stay ON until manual OFF command");
        } else {
            manualOverrideMode = false;
            relay.setRelayState(false);
            reason = remoteRelayReason + " (Returning to Automatic Mode)";
            Serial.println("Manual Override Mode DEACTIVATED - Returning to automatic soil moisture control");
        }
        
        relayTriggered = true;
        
        // Reset the command flag
        remoteRelayCommand = false;
    } else if (manualOverrideMode) {
        Serial.printf("Manual Override Mode: Relay stays ON (Soil: %d%%, but ignoring automatic control)\n", 
                     soilSensor.getPercentage());
        return; 
    } else {
        // Normal automatic control based on soil moisture (only when NOT in manual override)
        relay.control(soilSensor.getPercentage(), reason);
        relayTriggered = relay.hasStateChanged();
    }
    
    if (relayTriggered) {
        relay.printDebugInfo(reason);
        
        // Publish relay log to MQTT
        bool success = mqttClient.publishRelayLog(relay.isRelayActive(), reason);
        if (!success) {
            Serial.println("Warning: Failed to publish relay log to MQTT");
        }
        
        relay.updateLastState();
    }
}

void updateDisplay() {
    oled.updateSensorData(dht11.getTemperature(), dht11.getHumidity(),
                         soilSensor.getPercentage(), waterSensor.getStatus(),
                         rainSensor.isRainDetected(), relay.isRelayActive(),
                         mqttClient.isConnected()); 
}

void sendDataToMQTT() {  
    bool success = mqttClient.publishSensorData(
        dht11.getTemperature(),
        dht11.getHumidity(),
        soilSensor.getPercentage(),
        rainSensor.isRainDetected(),
        waterSensor.getStatus()
    );
    
    if (success) {
        Serial.println("✓ Sensor data published to MQTT successfully");
    } else {
        Serial.println("✗ Failed to publish sensor data to MQTT");
    }
}

void testSensors() {
    Serial.println("Testing sensors...");
    
    dht11.readData();
    soilSensor.readData();
    // soilTempSensor.readData();
    rainSensor.readData();
    waterSensor.readData();
    
    Serial.printf("Initial readings - Soil: %d, Rain: %s, Water: %d\n",
                  soilSensor.getRawValue(),
                  rainSensor.isRainDetected() ? "Rain detected" : "No rain",
                  waterSensor.getRawValue());
}