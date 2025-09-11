#include "network/MQTTClient.h"
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <time.h>
#include <SPIFFS.h>

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

extern bool remoteRelayCommand;
extern bool remoteRelayStatus;
extern String remoteRelayReason;
extern bool manualOverrideMode;

MQTTClient::MQTTClient(const char* server, int port, const char* user, const char* password, 
                       const char* deviceId, const char* sensorTopic, const char* relayTopic, 
                       const char* statusTopic, const char* relayCommandTopic) 
    : mqttServer(server), mqttPort(port), mqttUser(user), mqttPassword(password), 
      deviceId(deviceId), sensorDataTopic(sensorTopic), relayLogTopic(relayTopic), 
      statusTopic(statusTopic), relayCommandTopic(relayCommandTopic), lastReconnectAttempt(0), isConnectedFlag(false) {
    
    Serial.println("MQTT Client initialized for HiveMQ Cloud");
    Serial.printf("Server: %s:%d\n", mqttServer, mqttPort);
    Serial.printf("Device ID: %s\n", deviceId);
    Serial.printf("Topics:\n  Sensor: %s\n  Relay: %s\n  Status: %s\n  Relay Command: %s\n", 
                  sensorDataTopic, relayLogTopic, statusTopic, relayCommandTopic);
}

bool MQTTClient::loadCertificates() {
    Serial.println("Loading CA certificates for HiveMQ Cloud TLS connection");
    
    if (!SPIFFS.begin(true)) {
        Serial.println("Failed to mount SPIFFS filesystem");
        Serial.println("Run 'pio run --target uploadfs' to upload certificates");
        return false;
    }
    
    Serial.println("SPIFFS filesystem mounted successfully");
    
    Serial.println("Available SPIFFS files:");
    File root = SPIFFS.open("/");
    File file = root.openNextFile();
    bool hasFiles = false;
    while(file) {
        if (!file.isDirectory()) {
            Serial.printf("   %s (%d bytes)\n", file.name(), file.size());
            hasFiles = true;
        }
        file = root.openNextFile();
    }
    
    if (!hasFiles) {
        Serial.println("No files found - upload certificates first");
        return false;
    }
    
    Serial.println("Loading HiveMQ Cloud CA certificate from SPIFFS file");
    
    File certFile = SPIFFS.open("/hivemq_ca.crt", "r");
    if (!certFile) {
        Serial.println("Failed to open certificate file: /hivemq_ca.crt");
        Serial.println("Make sure to upload the certificate file first with: pio run --target uploadfs");
        return false;
    }
    
    size_t certSize = certFile.size();
    if (certSize == 0) {
        Serial.println("Certificate file is empty");
        certFile.close();
        return false;
    }
    
    String certificate = certFile.readString();
    certFile.close();
    
    if (certificate.length() == 0) {
        Serial.println("Failed to read certificate content");
        return false;
    }
    
    certificate.trim();
    certificate.replace("\r\n", "\n");  
    certificate.replace("\r", "\n");    
    
    while (certificate.indexOf("\n\n") != -1) {
        certificate.replace("\n\n", "\n");
    }
    
    Serial.printf("Certificate loaded from file (%d bytes)\n", certificate.length());
    Serial.println("Certificate preview (first 100 chars):");
    Serial.println(certificate.substring(0, 100));
    
    if (!certificate.startsWith("-----BEGIN CERTIFICATE-----") || 
        !certificate.endsWith("-----END CERTIFICATE-----")) {
        Serial.println("Invalid certificate format - must be PEM format");
        Serial.printf("Starts with BEGIN: %s\n", certificate.startsWith("-----BEGIN CERTIFICATE-----") ? "YES" : "NO");
        Serial.printf("Ends with END: %s\n", certificate.endsWith("-----END CERTIFICATE-----") ? "YES" : "NO");
        return false;
    }
    
    wifiClientSecure.setCACert(certificate.c_str());
    
    Serial.println("Certificate validation enabled");
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
        
        Serial.println("Synchronizing time with NTP server...");
        timeClient.begin();
        timeClient.update();
        
        time_t epochTime = timeClient.getEpochTime();
        struct timeval tv = {epochTime, 0};
        settimeofday(&tv, NULL);
        
        Serial.printf("Current time: %s", ctime(&epochTime));
        
        if (!loadCertificates()) {
            Serial.println("Certificate loading failed!");
            Serial.println("Cannot establish secure TLS connection without proper certificates");
            return false;
        }
        
        Serial.println("Certificates loaded - ready for secure TLS connection");
        
        mqttClient.setClient(wifiClientSecure);
        mqttClient.setServer(mqttServer, mqttPort);
        mqttClient.setKeepAlive(60);
        mqttClient.setSocketTimeout(30);
        
        mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
            this->handleMessage(topic, payload, length);
        });
        
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

    Serial.print("Connecting to HiveMQ Cloud MQTT broker with TLS...");
    
    String clientId = String("ESP32-") + deviceId + "-" + String(random(0xffff), HEX);
    
    bool connected = mqttClient.connect(clientId.c_str(), mqttUser, mqttPassword);
    
    if (connected) {
        Serial.println(" connected successfully with TLS!");
        isConnectedFlag = true;
        
        if (mqttClient.subscribe(relayCommandTopic)) {
            Serial.printf("Successfully subscribed to relay command topic: %s\n", relayCommandTopic);
        } else {
            Serial.printf("Failed to subscribe to relay command topic: %s\n", relayCommandTopic);
        }
        
        publishStatus("online");
        
        return true;
    } else {
        Serial.printf(" failed with TLS, rc=%d\n", mqttClient.state());
        Serial.println("MQTT Connection Error Codes:");
        Serial.println("-4: Connection timeout");
        Serial.println("-3: Connection lost");
        Serial.println("-2: Connect failed (likely TLS certificate issue)");
        Serial.println("-1: Disconnected");
        Serial.println(" 0: Connected");
        Serial.println(" 1: Wrong protocol version");
        Serial.println(" 2: Client ID rejected");
        Serial.println(" 3: Server unavailable");
        Serial.println(" 4: Bad credentials");
        Serial.println(" 5: Not authorized");
        Serial.println("If rc=-2, check certificate store and ensure proper CA certificates are loaded");
        
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

void MQTTClient::handleMessage(char* topic, byte* payload, unsigned int length) {
    // Convert payload to string
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    
    Serial.println("=== MQTT MESSAGE RECEIVED ===");
    Serial.printf("Topic: %s\n", topic);
    Serial.printf("Message: %s\n", message.c_str());
    Serial.printf("Length: %u\n", length);
    Serial.println("=============================");
    

    if (String(topic) == String(relayCommandTopic)) {
  
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, message);
        
        if (error) {
            Serial.println("Failed to parse relay command JSON");
            return;
        }
        
        if (doc["relayStatus"].is<bool>()) {
            bool relayStatus = doc["relayStatus"];
            String state = relayStatus ? "on" : "off";
            
            Serial.printf("Relay command received - RelayStatus: %s\n", relayStatus ? "true" : "false");
            
            remoteRelayCommand = true;
            remoteRelayStatus = relayStatus;
            remoteRelayReason = "Remote MQTT command: " + state;
            
            Serial.printf("Global variables set: command=%s, status=%s\n", 
                         remoteRelayCommand ? "true" : "false",
                         remoteRelayStatus ? "true" : "false");
            
            if (relayStatus) {
                Serial.println("Will activate Manual Override Mode (ignore soil moisture)");
            } else {
                Serial.println("Will deactivate Manual Override Mode (return to automatic control)");
            }
            
            if (doc["sensorReadingId"].is<const char*>()) {
                String sensorReadingId = doc["sensorReadingId"];
                Serial.printf("Linked to sensor reading ID: %s\n", sensorReadingId.c_str());
            }
        } else {
            Serial.println("No 'relayStatus' field found in relay command");
        }
    }
}

bool MQTTClient::publishSensorData(float temp, float humidity, int soilMoisture, float soilTemp, bool rain, String waterLevel) {
    if (!mqttClient.connected()) {
        Serial.println("MQTT not connected, cannot publish sensor data");
        return false;
    }

    JsonDocument doc;
    doc["temperature"] = temp;
    doc["humidity"] = humidity;
    doc["soilMoisture"] = soilMoisture;
    doc["soilTemperature"] = soilTemp;
    doc["rainDetected"] = rain;
    doc["waterLevel"] = waterLevel;

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
    doc["relayStatus"] = relayStatus;
    doc["triggerReason"] = reason;

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
