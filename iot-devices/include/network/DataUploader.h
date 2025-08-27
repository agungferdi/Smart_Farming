#ifndef DATA_UPLOADER_H
#define DATA_UPLOADER_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

class DataUploader {
private:
    const char* backendUrl; 
    const char* apiKey;
    long lastSensorId;  

public:
    DataUploader(const char* url, const char* key);
    bool connectWiFi(const char* ssid, const char* password);
    long sendSensorData(float temp, float humidity, int soilMoisture, bool rain, String waterLevel);
    bool sendRelayLog(bool relayStatus, String reason, long sensorReadingId);
    bool isWiFiConnected();
    void printConnectionInfo();
    IPAddress getLocalIP();
    long getLastSensorId() const;
};

#endif