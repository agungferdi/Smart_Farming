#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

class MQTTClient {
private:
    const char* mqttServer;
    int mqttPort;
    const char* mqttUser;
    const char* mqttPassword;
    const char* deviceId;
    
    const char* sensorDataTopic;
    const char* relayLogTopic;
    const char* statusTopic;
    const char* relayCommandTopic;
    
    WiFiClientSecure wifiClientSecure;
    PubSubClient mqttClient;
    
    unsigned long lastReconnectAttempt;
    bool isConnectedFlag;
    static const unsigned long RECONNECT_INTERVAL = 5000;
    static const int MAX_WIFI_ATTEMPTS = 20;
    
    bool loadCertificates();
    void handleMessage(char* topic, byte* payload, unsigned int length);

public:
    MQTTClient(const char* server, int port, const char* user, const char* password, 
               const char* deviceId, const char* sensorTopic, const char* relayTopic, 
               const char* statusTopic, const char* relayCommandTopic);
    
    bool connectWiFi(const char* ssid, const char* password);
    bool connectMQTT();
    void loop();
    void disconnect();
    bool isConnected();
    void printConnectionInfo();
    
    bool publishSensorData(float temp, float humidity, int soilMoisture, float soilTemp, bool rain, String waterLevel);
    bool publishRelayLog(bool relayStatus, String reason);
    bool publishStatus(String status);
};

#endif