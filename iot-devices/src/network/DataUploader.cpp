#include "network/DataUploader.h"

DataUploader::DataUploader(const char* url, const char* key) 
    : backendUrl(url), apiKey(key), lastSensorId(0) {
    Serial.println("DataUploader initialized for Backend API");
}

bool DataUploader::connectWiFi(const char* ssid, const char* password) {
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("WiFi connected!");
    printConnectionInfo();
    return true;
}

long DataUploader::sendSensorData(float temp, float humidity, int soilMoisture, bool rain, String waterLevel) {
    if (!isWiFiConnected()) {
        Serial.println("WiFi not connected");
        return 0;
    }

    HTTPClient http;
    String url = String(backendUrl) + "/api/sensor-data";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-ESP32-Device", "true");
    http.addHeader("Authorization", "Bearer " + String(apiKey));
    JsonDocument doc;
    doc["temperature"] = temp;
    doc["humidity"] = humidity;
    doc["soil_moisture"] = soilMoisture;
    doc["rain_detected"] = rain;
    doc["water_level"] = waterLevel;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.print("Sending sensor data to Backend: ");
    Serial.println(jsonString);

    // Send POST request
    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("Sensor data HTTP Response: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode == 201) {
            Serial.println("✅ Sensor data sent successfully!");
            
            JsonDocument responseDoc;
            deserializeJson(responseDoc, response);
            
            if (responseDoc["data"]["id"]) {
                lastSensorId = responseDoc["data"]["id"].as<long>();
                Serial.printf("Sensor reading saved with ID: %ld\n", lastSensorId);
            }
            
            http.end();
            return lastSensorId;
        } else {
            Serial.print("❌ Unexpected response. Response: ");
            Serial.println(response);
        }
    } else {
        Serial.print("❌ Error sending sensor data. HTTP error: ");
        Serial.println(httpResponseCode);
        Serial.print("Error: ");
        Serial.println(http.errorToString(httpResponseCode));
    }

    http.end();
    return 0;
}

bool DataUploader::sendRelayLog(bool relayStatus, String reason, long sensorReadingId) {
    if (!isWiFiConnected()) {
        Serial.println("WiFi not connected - cannot send relay log");
        return false;
    }

    if (sensorReadingId <= 0) {
        Serial.println("Invalid sensor reading ID - cannot send relay log");
        return false;
    }

    HTTPClient http;
    String url = String(backendUrl) + "/api/relay-log";

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-ESP32-Device", "true");
    http.addHeader("Authorization", "Bearer " + String(apiKey));

    JsonDocument doc;
    doc["relay_status"] = relayStatus;
    doc["trigger_reason"] = reason;
    doc["sensor_reading_id"] = sensorReadingId;  

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.print("Sending relay log to Backend: ");
    Serial.println(jsonString);


    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("Relay log HTTP Response: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode == 201) {
            Serial.println("✅ Relay log sent successfully!");
            http.end();
            return true;
        } else {
            Serial.print("❌ Unexpected relay log response. Response: ");
            Serial.println(response);
        }
    } else {
        Serial.print("❌ Error sending relay log. HTTP error: ");
        Serial.println(httpResponseCode);
        Serial.print("Error: ");
        Serial.println(http.errorToString(httpResponseCode));
    }

    http.end();
    return false;
}

bool DataUploader::isWiFiConnected() {
    return WiFi.status() == WL_CONNECTED;
}

void DataUploader::printConnectionInfo() {
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

IPAddress DataUploader::getLocalIP() {
    return WiFi.localIP();
}

long DataUploader::getLastSensorId() const {
    return lastSensorId;
}