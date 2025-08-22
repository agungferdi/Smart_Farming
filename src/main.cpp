#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// DHT11 sensor configuration
#define DHTPIN 4        // GPIO4
#define DHTTYPE DHT11   // DHT11 sensor

DHT dht(DHTPIN, DHTTYPE);

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSent = 0;
const unsigned long SENSOR_INTERVAL = 2000;   // Read sensor every 2 seconds
const unsigned long SEND_INTERVAL = 30000;    // Send data every 30 seconds

// Global variables for sensor data
float temperature = 0.0;
float humidity = 0.0;
bool sensorDataValid = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  dht.begin();
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void readSensorData() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  // Check if readings are valid
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    sensorDataValid = false;
    return;
  }
  
  temperature = t;
  humidity = h;
  sensorDataValid = true;
  
  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %\t");
  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.println(" °C");
}

bool sendDataToDatabase() {
  if (!sensorDataValid) {
    Serial.println("No valid sensor data to send");
    return false;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }
  
  HTTPClient http;
  
  // Supabase REST API endpoint for your table
  String url = String(SUPABASE_URL) + "/rest/v1/temp-and-humidity";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_SERVICE_ROLE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_SERVICE_ROLE_KEY));
  http.addHeader("Prefer", "return=minimal");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Sending data: ");
  Serial.println(jsonString);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode == 201) {
      Serial.println("Data successfully sent to database!");
      return true;
    } else {
      Serial.print("Unexpected response code. Response: ");
      Serial.println(response);
      return false;
    }
  } else {
    Serial.print("Error sending data. HTTP error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
    return false;
  }
  
  http.end();
  return false;
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensor data every 2 seconds
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensorData();
    lastSensorRead = currentTime;
  }
  
  if (currentTime - lastDataSent >= SEND_INTERVAL) {
    if (sendDataToDatabase()) {
      Serial.println("Data sent successfully");
    } else {
      Serial.println("Data transmission failed");
    }
    
    lastDataSent = currentTime;
  }
  
  delay(100);
}
