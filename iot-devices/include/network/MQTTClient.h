#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

class MQTTClient {
private:
    WiFiClientSecure wifiClientSecure;
    PubSubClient mqttClient;
    const char* mqttServer;
    int mqttPort;
    const char* mqttUser;
    const char* mqttPassword;
    const char* deviceId;
    
    // MQTT Topics
    const char* sensorDataTopic;
    const char* relayLogTopic;
    const char* statusTopic;
    const char* relayCommandTopic; 
    
    unsigned long lastReconnectAttempt;
    const unsigned long RECONNECT_INTERVAL = 5000;
    bool isConnectedFlag;

    // Certificate loading
    bool loadCertificates();
    
    // Message handling
    void handleMessage(char* topic, byte* payload, unsigned int length);

public:
    MQTTClient(const char* server, int port, const char* user, const char* password, 
               const char* deviceId, const char* sensorTopic, const char* relayTopic, 
               const char* statusTopic, const char* relayCommandTopic);
    
    bool connectWiFi(const char* ssid, const char* password);
    bool connectMQTT();
    void loop();
    bool publishSensorData(float temp, float humidity, int soilMoisture, bool rain, String waterLevel);
    bool publishRelayLog(bool relayStatus, String reason);
    bool publishStatus(String status);
    bool isConnected();
    void printConnectionInfo();
    void disconnect();
};

#endif
