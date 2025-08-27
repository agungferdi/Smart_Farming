#ifndef DATA_UPLOADER_H
#define DATA_UPLOADER_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

class DataUploader {
private:
    const char* supabaseUrl;
    const char* apiKey;
    long lastSensorId;  // Store the ID of the last sensor reading
    
public:
    DataUploader(const char* url, const char* key);
    bool connectWiFi(const char* ssid, const char* password);
    
    // Modified to include soil_temperature and return sensor ID
    long sendSensorData(float temp, float humidity, int soilMoisture, 
                       /*float soilTemp,*/ bool rain, String waterLevel);
    
    // Modified to use sensor_reading_id (normalized schema)
    bool sendRelayLog(bool relayStatus, String reason, long sensorReadingId);
    
    bool isWiFiConnected();
    void printConnectionInfo();
    IPAddress getLocalIP();
    long getLastSensorId() const;  // Get the ID of last sensor reading
};

#endif