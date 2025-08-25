#ifndef DATA_UPLOADER_H
#define DATA_UPLOADER_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

class DataUploader {
private:
    const char* supabaseUrl;
    const char* apiKey;
    
public:
    DataUploader(const char* url, const char* key);
    bool connectWiFi(const char* ssid, const char* password);
    bool sendSensorData(float temp, float humidity, int soilMoisture, 
                       bool rain, String waterLevel);
    bool sendRelayLog(bool relayStatus, String reason, int soilMoisture, 
                     float temperature, bool rain);
    bool isWiFiConnected();
    void printConnectionInfo();
    IPAddress getLocalIP();
};

#endif
