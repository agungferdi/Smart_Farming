#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// DHT11 sensor configuration
#define DHTPIN 4 // GPIO4 (safe with WiFi)
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
bool sensorDataValid = false;

// Function declarations
int readSoilMoisture();
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
  return sensorValue;
}

void readSensorData()
{
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Read soil moisture via analog pin
  int soilValue = readSoilMoisture();

  // Debug: Print raw analog reading
  Serial.print("Raw analog reading from soil sensor: ");
  Serial.println(soilValue);

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
  soilMoistureValue = soilValue;
  sensorDataValid = true;

  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %\t");
  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.print(" °C\t");
  Serial.print("Soil Moisture: ");
  Serial.println(soilValue);
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
  doc["soil_moisture"] = soilMoistureValue;

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
      Serial.println("All sensor data sent successfully to unified table!");
    }
    else
    {
      Serial.println("Failed to send sensor data");
    }

    lastDataSent = currentTime;
  }

  delay(100);
}
