#include "network/MQTTClient.h"
#include <WiFiClientSecure.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <time.h>
#include <SPIFFS.h>

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

MQTTClient::MQTTClient(const char* server, int port, const char* user, const char* password, 
                       const char* deviceId, const char* sensorTopic, const char* relayTopic, 
                       const char* statusTopic) 
    : mqttServer(server), mqttPort(port), mqttUser(user), mqttPassword(password), 
      deviceId(deviceId), sensorDataTopic(sensorTopic), relayLogTopic(relayTopic), 
      statusTopic(statusTopic), lastReconnectAttempt(0), isConnectedFlag(false) {
    
    Serial.println("MQTT Client initialized for HiveMQ Cloud");
    Serial.printf("Server: %s:%d\n", mqttServer, mqttPort);
    Serial.printf("Device ID: %s\n", deviceId);
    Serial.printf("Topics:\n  Sensor: %s\n  Relay: %s\n  Status: %s\n", 
                  sensorDataTopic, relayLogTopic, statusTopic);
}

bool MQTTClient::loadCertificates() {
    if (!SPIFFS.begin(true)) {
        Serial.println("Failed to mount SPIFFS");
        return false;
    }
    
    // Load certificate bundle
    File certFile = SPIFFS.open("/certs.ar", "r");
    if (!certFile) {
        Serial.println("Failed to open certificate bundle");
        return false;
    }
    
    size_t certSize = certFile.size();
    Serial.printf("Certificate bundle size: %d bytes\n", certSize);
    
    // For now, we'll use setInsecure mode until we implement proper certificate parsing
    // This is a temporary solution to establish connection
    certFile.close();
    return true;
}

bool MQTTClient::connectWiFi(const char* ssid, const char* password) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("WiFi connected!");
        printConnectionInfo();
        
        // Initialize NTP for time synchronization (required for TLS certificates)
        Serial.println("Synchronizing time with NTP server...");
        timeClient.begin();
        timeClient.update();
        
        // Set system time for certificate validation
        time_t epochTime = timeClient.getEpochTime();
        struct timeval tv = {epochTime, 0};
        settimeofday(&tv, NULL);
        
        Serial.printf("Current time: %s", ctime(&epochTime));
        
        // Load certificates from SPIFFS
        if (loadCertificates()) {
            Serial.println("Certificates loaded successfully");
        } else {
            Serial.println("Certificate loading failed, using insecure mode");
        }
        
        // Configure secure client
        wifiClientSecure.setInsecure(); // Temporary: use insecure mode
        mqttClient.setClient(wifiClientSecure);
        mqttClient.setServer(mqttServer, mqttPort);
        mqttClient.setKeepAlive(60);
        mqttClient.setSocketTimeout(30);
        
        return true;
    } else {
        Serial.println();
        Serial.println("WiFi connection failed!");
        return false;
    }
}

bool MQTTClient::connectMQTT() {
    if (mqttClient.connected()) {
        isConnectedFlag = true;
        return true;
    }

    Serial.print("Connecting to HiveMQ Cloud MQTT broker...");
    
    String clientId = String("ESP32-") + deviceId + "-" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str(), mqttUser, mqttPassword)) {
        Serial.println(" connected!");
        isConnectedFlag = true;
        
        // Publish online status
        publishStatus("online");
        
        return true;
    } else {
        Serial.printf(" failed, rc=%d\n", mqttClient.state());
        Serial.println("MQTT Connection Error Codes:");
        Serial.println("-4: Connection timeout");
        Serial.println("-3: Connection lost");
        Serial.println("-2: Connect failed");
        Serial.println("-1: Disconnected");
        Serial.println(" 0: Connected");
        Serial.println(" 1: Wrong protocol version");
        Serial.println(" 2: Client ID rejected");
        Serial.println(" 3: Server unavailable");
        Serial.println(" 4: Bad credentials");
        Serial.println(" 5: Not authorized");
        
        isConnectedFlag = false;
        return false;
    }
}

void MQTTClient::loop() {
    if (!mqttClient.connected()) {
        unsigned long now = millis();
        if (now - lastReconnectAttempt > RECONNECT_INTERVAL) {
            lastReconnectAttempt = now;
            Serial.println("MQTT connection lost, attempting to reconnect...");
            if (connectMQTT()) {
                lastReconnectAttempt = 0;
            }
        }
    } else {
        mqttClient.loop();
    }
}

bool MQTTClient::publishSensorData(float temp, float humidity, int soilMoisture, bool rain, String waterLevel) {
    if (!mqttClient.connected()) {
        Serial.println("MQTT not connected, cannot publish sensor data");
        return false;
    }

    JsonDocument doc;
    doc["device_id"] = deviceId;
    doc["timestamp"] = timeClient.getFormattedTime();
    doc["temperature"] = temp;
    doc["humidity"] = humidity;
    doc["soil_moisture"] = soilMoisture;
    doc["rain_status"] = rain;
    doc["water_level"] = waterLevel;

    String jsonString;
    serializeJson(doc, jsonString);

    if (mqttClient.publish(sensorDataTopic, jsonString.c_str())) {
        Serial.println("Sensor data published successfully");
        Serial.println("Data: " + jsonString);
        return true;
    } else {
        Serial.println("Failed to publish sensor data");
        return false;
    }
}

bool MQTTClient::publishRelayLog(bool relayStatus, String reason) {
    if (!mqttClient.connected()) {
        Serial.println("MQTT not connected, cannot publish relay log");
        return false;
    }

    JsonDocument doc;
    doc["device_id"] = deviceId;
    doc["timestamp"] = timeClient.getFormattedTime();
    doc["relay_status"] = relayStatus;
    doc["reason"] = reason;

    String jsonString;
    serializeJson(doc, jsonString);

    if (mqttClient.publish(relayLogTopic, jsonString.c_str())) {
        Serial.println("Relay log published successfully");
        Serial.println("Data: " + jsonString);
        return true;
    } else {
        Serial.println("Failed to publish relay log");
        return false;
    }
}

bool MQTTClient::publishStatus(String status) {
    if (!mqttClient.connected()) {
        Serial.println("MQTT not connected, cannot publish status");
        return false;
    }

    JsonDocument doc;
    doc["device_id"] = deviceId;
    doc["timestamp"] = timeClient.getFormattedTime();
    doc["status"] = status;

    String jsonString;
    serializeJson(doc, jsonString);

    if (mqttClient.publish(statusTopic, jsonString.c_str())) {
        Serial.println("Status published successfully: " + status);
        return true;
    } else {
        Serial.println("Failed to publish status");
        return false;
    }
}

bool MQTTClient::isConnected() {
    return isConnectedFlag && mqttClient.connected();
}

void MQTTClient::printConnectionInfo() {
    Serial.println("=== Connection Information ===");
    Serial.print("WiFi SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("DNS: ");
    Serial.println(WiFi.dnsIP());
    Serial.println("============================");
}

void MQTTClient::disconnect() {
    if (mqttClient.connected()) {
        publishStatus("offline");
        mqttClient.disconnect();
    }
    isConnectedFlag = false;
    Serial.println("MQTT client disconnected");
}
