#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "../include/config.h"

// OLED Display configuration
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET -1    // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C // See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
#define SDA_PIN 21       // SDA pin
#define SCL_PIN 22       // SCL pin

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// DHT11 sensor configuration
#define DHTPIN 16 // GPIO16 (safe with WiFi)
#define DHTTYPE DHT11
// Soil moisture sensor configuration
int sensorPin = 35;  // GPIO35 (ADC1 - safe with WiFi)
int sensorValue = 0; // Variable to store sensor value
// Relay (water pump) configuration
#define RELAY_PIN 17 // GPIO17 for relay control
// Rain sensor (MH-RD) configuration
#define RAIN_SENSOR_PIN 18 // GPIO18 for digital rain detection
// Water level sensor configuration
#define WATER_LEVEL_PIN 34 // GPIO34 for water level sensor (analog - ADC capable)

// Water level calibration values based on actual sensor readings
#define WATER_DRY_VALUE 0        // Sensor value when dry (no water)
#define WATER_WET_VALUE 1050     // Sensor value when sensor is fully submerged
#define SENSOR_HEIGHT_CM 5       // Actual height of your sensor in cm

DHT dht(DHTPIN, DHTTYPE);

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSent = 0;
const unsigned long SENSOR_INTERVAL = 2000; // Read sensor every 2 seconds
const unsigned long SEND_INTERVAL = 15000;  // Send data every 15 seconds (changed from 30s)

// Global variables for sensor data
float temperature = 0.0;
float humidity = 0.0;
int soilMoistureValue = 0;
int soilMoisturePercent = 0;  // New variable for percentage
bool rainDetected = false;    // Rain sensor reading
int waterLevelValue = 0;      // Raw water level reading
String waterLevelStatus = ""; // Water level status (Low/Medium/High)
bool sensorDataValid = false;

// Relay control variables
bool relayActive = false;
bool lastRelayState = false;

// Automation thresholds
const int SOIL_MOISTURE_THRESHOLD = 20;  // 0-20% soil moisture triggers pump
const float TEMPERATURE_THRESHOLD = 33.0; // Temperature must be >= 33°C

// Soil moisture calibration values
const int DRY_VALUE = 4095;    // 0% moisture (completely dry)
const int WET_VALUE = 1600;    // 100% moisture (completely wet)

// Function declarations
void initOLED();
void updateOLEDDisplay();
int readSoilMoisture();
int convertToPercentage(int rawValue);
bool readRainSensor();
int readWaterLevel();
String getWaterLevelStatus(int rawValue);
void readSensorData();
void controlRelay();
bool sendSensorData();
bool sendRelayLog(bool relayStatus, String reason);

void setup()
{
  Serial.begin(115200);
  delay(1000);

  // Initialize I2C for OLED display
  Wire.begin(SDA_PIN, SCL_PIN);
  
  // Initialize OLED display
  initOLED();

  // Initialize relay pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // Start with relay OFF (HIGH = OFF for low-triggered relay)
  relayActive = false;
  lastRelayState = false;

  // Initialize rain sensor pin
  pinMode(RAIN_SENSOR_PIN, INPUT);

  // Initialize sensors
  Serial.println("Initializing sensors...");
  Serial.println("DHT11 on GPIO16, Soil moisture on GPIO35, Relay on GPIO17, Rain sensor on GPIO18, Water level on GPIO34, OLED on SDA21/SCL22");

  dht.begin();

  // Test sensors immediately
  Serial.println("Testing sensors...");
  int testSoilValue = readSoilMoisture();
  bool testRainValue = readRainSensor();
  int testWaterValue = readWaterLevel();
  Serial.print("Initial soil moisture reading: ");
  Serial.println(testSoilValue);
  Serial.print("Initial rain sensor reading: ");
  Serial.println(testRainValue ? "Rain detected" : "No rain");
  Serial.print("Initial water level reading: ");
  Serial.println(testWaterValue);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.println("Smart Irrigation System with Rain Detection Ready!");
}

int readSoilMoisture()
{
  // Read the analog value from the sensor (using your preferred style)
  sensorValue = analogRead(sensorPin);
  
  // Debug: Check if we're getting valid readings
  Serial.print("DEBUG: Reading from GPIO");
  Serial.print(sensorPin);
  Serial.print(" = ");
  Serial.println(sensorValue);
  
  return sensorValue;
}

int convertToPercentage(int rawValue)
{
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

bool readRainSensor()
{
  // Read the digital pin from MH-RD rain sensor
  // MH-RD typically: LOW = rain detected, HIGH = no rain
  int digitalValue = digitalRead(RAIN_SENSOR_PIN);
  
  // Convert to boolean (invert logic since LOW = rain)
  bool isRaining = (digitalValue == LOW);
  
  // Debug output
  Serial.print("DEBUG: Rain sensor GPIO");
  Serial.print(RAIN_SENSOR_PIN);
  Serial.print(" = ");
  Serial.print(digitalValue);
  Serial.print(" (Rain: ");
  Serial.print(isRaining ? "true" : "false");
  Serial.println(")");
  
  return isRaining;
}

int readWaterLevel()
{
  // Read sensor value
  int rawValue = analogRead(WATER_LEVEL_PIN);
  
  // Debug output with raw value
  Serial.printf("Water Level - Raw Value: %d | Status: %s\n", 
                rawValue, getWaterLevelStatus(rawValue).c_str());
  
  return rawValue;
}

String getWaterLevelStatus(int rawValue)
{
  // Determine water level status based on raw value
  String status;
  if (rawValue < 350) {
    status = "Low";
  } else if (rawValue < 400) {
    status = "Medium";
  } else {
    status = "High";
  }
  
  return status;
}

void readSensorData()
{
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Read soil moisture via analog pin
  int soilValue = readSoilMoisture();
  
  // Convert raw value to percentage
  int soilPercent = convertToPercentage(soilValue);

  // Read rain sensor
  bool isRaining = readRainSensor();

  // Read water level sensor
  int waterValue = readWaterLevel();
  
  // Get water level status
  String waterStatus = getWaterLevelStatus(waterValue);

  // Debug: Print both raw and status values
  Serial.print("Raw analog reading from soil sensor: ");
  Serial.print(soilValue);
  Serial.print(" (");
  Serial.print(soilPercent);
  Serial.println("% moisture)");
  
  Serial.print("Raw analog reading from water level sensor: ");
  Serial.print(waterValue);
  Serial.print(" (Status: ");
  Serial.print(waterStatus);
  Serial.println(")");

  if (isnan(h) || isnan(t))
  {
    Serial.println("Failed to read from DHT sensor!");
    sensorDataValid = false;
    return;
  }

  if (soilValue < 0 || soilValue > 4095)
  {
    Serial.println("Invalid soil moisture reading!");
    sensorDataValid = false;
    return;
  }

  if (waterValue < 0 || waterValue > 4095)
  {
    Serial.println("Invalid water level reading!");
    sensorDataValid = false;
    return;
  }

  temperature = t;
  humidity = h;
  soilMoistureValue = soilValue;          // Keep raw value for debugging
  soilMoisturePercent = soilPercent;      // Store percentage for database
  rainDetected = isRaining;               // Store rain detection status
  waterLevelValue = waterValue;           // Keep raw value for debugging
  waterLevelStatus = waterStatus;         // Store status for database
  sensorDataValid = true;

  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %\t");
  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.print(" °C\t");
  Serial.print("Soil Moisture: ");
  Serial.print(soilPercent);
  Serial.print("%\t");
  Serial.print("Water Level: ");
  Serial.print(waterStatus);
  Serial.print("\t");
  Serial.print("Rain: ");
  Serial.println(isRaining ? "true" : "false");
}

void controlRelay()
{
  if (!sensorDataValid) return;

  bool shouldActivate = false;
  String reason = "";

  // Check automation conditions (original logic - no rain sensor involved)
  if (soilMoisturePercent <= SOIL_MOISTURE_THRESHOLD && temperature >= TEMPERATURE_THRESHOLD) {
    shouldActivate = true;
    reason = "Low soil moisture (" + String(soilMoisturePercent) + "%) and high temperature (" + String(temperature) + "°C)";
  } else {
    shouldActivate = false;  // Explicitly set to false (though it already is)
    if (soilMoisturePercent > SOIL_MOISTURE_THRESHOLD) {
      reason = "Soil moisture sufficient (" + String(soilMoisturePercent) + "%)";
    } else if (temperature < TEMPERATURE_THRESHOLD) {
      reason = "Temperature too low (" + String(temperature) + "°C)";
    } else {
      reason = "Conditions no longer met - Soil: " + String(soilMoisturePercent) + "%, Temp: " + String(temperature) + "°C";
    }
  }

  // Update relay state - LOW-triggered relay (LOW = ON, HIGH = OFF)
  relayActive = shouldActivate;
  digitalWrite(RELAY_PIN, relayActive ? LOW : HIGH);  // LOW = ON, HIGH = OFF for low-triggered relay

  // Log relay status changes
  if (relayActive != lastRelayState) {
    String status = relayActive ? "ACTIVATED" : "DEACTIVATED";
    Serial.println("=== WATER PUMP " + status + " ===");
    Serial.println("Reason: " + reason);
    
    Serial.print("Current conditions - Soil: ");
    Serial.print(soilMoisturePercent);
    Serial.print("%, Temp: ");
    Serial.print(temperature);
    Serial.print("°C, Rain: ");
    Serial.println(rainDetected ? "true" : "false");
    
    Serial.print("Relay Pin (GPIO17) set to: ");
    Serial.println(relayActive ? "LOW (ON)" : "HIGH (OFF)");
    Serial.print("Expected LED behavior: ");
    Serial.println(relayActive ? "LED OFF (pump running)" : "LED ON (pump stopped)");
    
    // Send relay log to database only when state changes
    sendRelayLog(relayActive, reason);
    
    lastRelayState = relayActive;
  }
}

bool sendSensorData()
{
  if (!sensorDataValid)
  {
    Serial.println("No valid sensor data to send");
    return false;
  }

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi not connected");
    return false;
  }

  HTTPClient http;

  // Supabase REST API endpoint for the sensor-data table
  String url = String(SUPABASE_URL) + "/rest/v1/sensor-data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_SERVICE_ROLE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_SERVICE_ROLE_KEY));
  http.addHeader("Prefer", "return=minimal");

  // Create JSON payload with sensor data
  JsonDocument doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soil_moisture"] = soilMoisturePercent;
  doc["rain_detected"] = rainDetected;
  doc["water_level"] = waterLevelStatus;  // Send status instead of percentage

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("Sending sensor data: ");
  Serial.println(jsonString);

  // Send POST request
  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0)
  {
    String response = http.getString();
    Serial.print("Sensor data HTTP Response: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 201)
    {
      Serial.println("Sensor data sent successfully!");
      http.end();
      return true;
    }
    else
    {
      Serial.print("Unexpected response. Response: ");
      Serial.println(response);
    }
  }
  else
  {
    Serial.print("Error sending sensor data. HTTP error: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
  return false;
}

bool sendRelayLog(bool relayStatus, String reason)
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi not connected - cannot send relay log");
    return false;
  }

  HTTPClient http;

  // Supabase REST API endpoint for the relay-log table
  String url = String(SUPABASE_URL) + "/rest/v1/relay-log";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_SERVICE_ROLE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_SERVICE_ROLE_KEY));
  http.addHeader("Prefer", "return=minimal");

  // Create JSON payload with relay log data
  JsonDocument doc;
  doc["relay_status"] = relayStatus;
  doc["trigger_reason"] = reason;
  doc["soil_moisture"] = soilMoisturePercent;
  doc["temperature"] = temperature;
  doc["rain_detected"] = rainDetected;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("Sending relay log: ");
  Serial.println(jsonString);

  // Send POST request
  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0)
  {
    String response = http.getString();
    Serial.print("Relay log HTTP Response: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 201)
    {
      Serial.println("Relay log sent successfully!");
      http.end();
      return true;
    }
    else
    {
      Serial.print("Unexpected relay log response. Response: ");
      Serial.println(response);
    }
  }
  else
  {
    Serial.print("Error sending relay log. HTTP error: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
  return false;
}

void loop()
{
  unsigned long currentTime = millis();

  // Read sensors every 2 seconds
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL)
  {
    readSensorData();
    
    // Check relay control after reading sensors
    if (sensorDataValid) {
      controlRelay();
      // Update OLED display with new sensor data
      updateOLEDDisplay();
    }
    
    lastSensorRead = currentTime;
  }

  // Send sensor data every 15 seconds
  if (currentTime - lastDataSent >= SEND_INTERVAL)
  {
    bool success = sendSensorData();

    if (success)
    {
      Serial.println("✓ Sensor data sent to database");
    }
    else
    {
      Serial.println("✗ Failed to send sensor data");
    }

    lastDataSent = currentTime;
  }

  delay(100);
}

// OLED Display Functions
void initOLED()
{
  Serial.println("Initializing OLED display...");
  
  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;); // Don't proceed, loop forever
  }

  // Show initial display buffer contents on the screen --
  // the library initializes this with an Adafruit splash screen.
  display.display();
  delay(2000); // Pause for 2 seconds

  // Clear the buffer
  display.clearDisplay();
  
  // Display startup message
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("Smart Irrigation"));
  display.println(F("System Starting..."));
  display.println(F(""));
  display.println(F("SDA: GPIO21"));
  display.println(F("SCL: GPIO22"));
  display.display();
  delay(3000);
  
  Serial.println("OLED display initialized successfully!");
}

void updateOLEDDisplay()
{
  // Clear the display
  display.clearDisplay();
  
  // Set text properties
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  
  // Title
  display.setTextSize(1);
  display.println(F("Smart Irrigation"));
  display.println(F("================"));
  
  // Temperature
  display.print(F("Temp: "));
  display.print(temperature, 1);
  display.println(F(" C"));
  
  // Humidity
  display.print(F("Humid: "));
  display.print(humidity, 1);
  display.println(F(" %"));
  
  // Soil Moisture
  display.print(F("Soil: "));
  display.print(soilMoisturePercent);
  display.println(F(" %"));
  
  // Water Level
  display.print(F("Water: "));
  display.println(waterLevelStatus);
  
  // Rain Status
  display.print(F("Rain: "));
  display.println(rainDetected ? F("YES") : F("NO"));
  
  // Pump Status
  display.print(F("Pump: "));
  display.println(relayActive ? F("ON") : F("OFF"));
  
  // WiFi Status
  display.print(F("WiFi: "));
  display.println(WiFi.status() == WL_CONNECTED ? F("OK") : F("FAIL"));
  
  // Display everything on the screen
  display.display();
}
