#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// DHT11 sensor configuration
#define DHTPIN 16 // GPIO4 (safe with WiFi - moved from GPIO4)
#define DHTTYPE DHT11
// Soil moisture sensor configuration
int sensorPin = 35;  // GPIO35 (ADC1 - safe with WiFi)
int sensorValue = 0; // Variable to store sensor value

DHT dht(DHTPIN, DHTTYPE);

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSent = 0;
const unsigned long SENSOR_INTERVAL = 2000; // Read sensor every 2 seconds
const unsigned long SEND_INTERVAL = 30000;  // Send data every 30 seconds

// Global variables for sensor data
float temperature = 0.0;
float humidity = 0.0;
int soilMoistureValue = 0;
int soilMoisturePercent = 0;  // New variable for percentage
bool sensorDataValid = false;

// Soil moisture calibration values
const int DRY_VALUE = 4095;    // 0% moisture (completely dry)
const int WET_VALUE = 1600;    // 100% moisture (completely wet)

// Function declarations
int readSoilMoisture();
int convertToPercentage(int rawValue);
void readSensorData();
bool sendAllSensorData();

void setup()
{
  Serial.begin(115200);
  delay(1000);

  // Initialize sensors
  Serial.println("Initializing sensors...");
  Serial.println("DHT11 on GPIO2, Soil moisture on GPIO35");

  dht.begin();

  // Test soil moisture sensor immediately
  Serial.println("Testing sensors...");
  int testValue = readSoilMoisture();
  Serial.print("Initial soil moisture reading: ");
  Serial.println(testValue);

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

void readSensorData()
{
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Read soil moisture via analog pin
  int soilValue = readSoilMoisture();
  
  // Convert raw value to percentage
  int soilPercent = convertToPercentage(soilValue);

  // Debug: Print both raw and percentage values
  Serial.print("Raw analog reading from soil sensor: ");
  Serial.print(soilValue);
  Serial.print(" (");
  Serial.print(soilPercent);
  Serial.println("% moisture)");

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

  temperature = t;
  humidity = h;
  soilMoistureValue = soilValue;          // Keep raw value for debugging
  soilMoisturePercent = soilPercent;      // Store percentage for database
  sensorDataValid = true;

  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %\t");
  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.print(" °C\t");
  Serial.print("Soil Moisture: ");
  Serial.print(soilPercent);
  Serial.println("%");
}

bool sendAllSensorData()
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

  // Supabase REST API endpoint for the unified sensor-data table
  String url = String(SUPABASE_URL) + "/rest/v1/sensor-data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_SERVICE_ROLE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_SERVICE_ROLE_KEY));
  http.addHeader("Prefer", "return=minimal");

  // Create JSON payload with all sensor data
  JsonDocument doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soil_moisture"] = soilMoisturePercent;  // Send percentage instead of raw value

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("Sending all sensor data: ");
  Serial.println(jsonString);

  // Send POST request
  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0)
  {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 201)
    {
      Serial.println("All sensor data sent successfully to database!");
      return true;
    }
    else
    {
      Serial.print("Unexpected response code. Response: ");
      Serial.println(response);
      return false;
    }
  }
  else
  {
    Serial.print("Error sending data. HTTP error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
    return false;
  }

  http.end();
  return false;
}

void loop()
{
  unsigned long currentTime = millis();

  if (currentTime - lastSensorRead >= SENSOR_INTERVAL)
  {
    readSensorData();
    lastSensorRead = currentTime;
  }

  if (currentTime - lastDataSent >= SEND_INTERVAL)
  {
    bool success = sendAllSensorData();

    if (success)
    {
      Serial.println("All sensor data sent");
    }
    else
    {
      Serial.println("Failed to send sensor data");
    }

    lastDataSent = currentTime;
  }

  delay(100);
}
