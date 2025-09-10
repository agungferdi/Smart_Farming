#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

class MQTTClient {
private:
    // Connection settings
    const char* mqttServer;
    int mqttPort;
    const char* mqttUser;
    const char* mqttPassword;
    const char* deviceId;
    
    // MQTT topics
    const char* sensorDataTopic;
    const char* relayLogTopic;
    const char* statusTopic;
    const char* relayCommandTopic;
    
    // Client objects
    WiFiClientSecure wifiClientSecure;
    PubSubClient mqttClient;
    
    // Connection management
    unsigned long lastReconnectAttempt;
    bool isConnectedFlag;
    static const unsigned long RECONNECT_INTERVAL = 5000;
    
    // Private methods
    bool loadCertificates();
    void handleMessage(char* topic, byte* payload, unsigned int length);

public:
    // Constructor
    MQTTClient(const char* server, int port, const char* user, const char* password, 
               const char* deviceId, const char* sensorTopic, const char* relayTopic, 
               const char* statusTopic, const char* relayCommandTopic);
    
    // Connection methods
    bool connectWiFi(const char* ssid, const char* password);
    bool connectMQTT();
    void loop();
    void disconnect();
    bool isConnected();
    void printConnectionInfo();
    
    // Publishing methods
    bool publishSensorData(float temp, float humidity, int soilMoisture, float soilTemp, bool rain, String waterLevel);
    bool publishRelayLog(bool relayStatus, String reason);
    bool publishStatus(String status);
};

#endif