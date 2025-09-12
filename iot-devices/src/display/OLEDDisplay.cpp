#include "display/OLEDDisplay.h"

OLEDDisplay::OLEDDisplay(int sdaPin, int sclPin) 
    : display(nullptr), sdaPin(sdaPin), sclPin(sclPin) {
}

OLEDDisplay::~OLEDDisplay() {
    if (display) {
        delete display;
        display = nullptr;
    }
}

bool OLEDDisplay::begin() {
    Serial.println("Initializing OLED display...");
    
    Wire.begin(sdaPin, sclPin);
    delay(100);
    
    Serial.println("Scanning I2C devices...");
    byte i2cResult, address;
    int nDevices = 0;
    bool foundOLED = false;

    // I2C 7-bit address range: 0x01 to 0x7F (1 to 127)
    const byte I2C_ADDRESS_MIN = 1;
    const byte I2C_ADDRESS_MAX = 127; // 0x7F, exclusive in loop

    // Wire.endTransmission() returns 0 on success, nonzero on error
    const byte I2C_DEVICE_PRESENT_CODE = 0; // 0 means device responded
    for(address = I2C_ADDRESS_MIN; address < I2C_ADDRESS_MAX; address++) {
        Wire.beginTransmission(address);
        i2cResult = Wire.endTransmission();
        
        if (i2cResult == 0) {
            Serial.printf("I2C device found at address 0x%02X\n", address);
            if (address == 0x3C || address == 0x3D) {
                foundOLED = true;
            }
            nDevices++;
        }
    }
    
    if (nDevices == 0) {
        Serial.println("No I2C devices found!");
        Serial.println("Check your wiring:");
        Serial.printf("SDA should be connected to GPIO%d\n", sdaPin);
        Serial.printf("SCL should be connected to GPIO%d\n", sclPin);
        Serial.println("VCC should be connected to 3.3V");
        Serial.println("GND should be connected to GND");
        return false;
    } else {
        Serial.printf("Found %d I2C device(s)\n", nDevices);
    }
    
    if (!foundOLED) {
        Serial.println("No OLED display found at expected addresses (0x3C or 0x3D)");
        return false;
    }
    
    Serial.println("Creating display object...");
    display = new Adafruit_SSD1306(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
    
    if (!display) {
        Serial.println("Failed to create display object!");
        return false;
    }
    
    Serial.printf("Trying OLED at address 0x3C...\n");
    if (!display->begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.printf("Failed. Trying OLED at address 0x3D...\n");
        if (!display->begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
            Serial.println(F("SSD1306 initialization failed at both 0x3C and 0x3D"));
            Serial.printf("Failed to initialize OLED on SDA:%d, SCL:%d\n", 
                         sdaPin, sclPin);
            delete display;
            display = nullptr;
            return false;
        } else {
            Serial.println("OLED successfully initialized at address 0x3D!");
        }
    } else {
        Serial.println("OLED successfully initialized at address 0x3C!");
    }

    display->display();
    delay(2000);

    Serial.println("OLED display initialized successfully!");
    return true;
}

void OLEDDisplay::showStartupMessage() {
    if (!display) return;
}

void OLEDDisplay::updateSensorData(float temp, float humidity, int soilMoisture, float soilTemp,
                                  String waterLevel, bool rain, bool pumpActive, bool wifiConnected) {
    if (!display) return;
    
    display->clearDisplay();
    display->setTextColor(SSD1306_WHITE);
    
    display->setTextSize(1);
    display->setCursor(0, 0);
    display->printf("SOIL: %d%%", soilMoisture);
     
    display->setCursor(0, 12);
    display->printf("PUMP: %s", pumpActive ? "ON" : "OFF");
    
    display->setCursor(0, 24);
    display->printf("Soil Temp: %.1fC", soilTemp);
    
    display->setCursor(0, 36);
    display->printf("Air:%.0fC Hum:%.0f%%", temp, humidity);
    
    display->setCursor(0, 48);
    display->printf("Water:%s Rain:%s", waterLevel.c_str(), rain ? "YES" : "NO");
    
    display->setCursor(0, 56);
    display->printf("WiFi:%s", wifiConnected ? "OK" : "FAIL");
    
    display->display();
}

void OLEDDisplay::clearDisplay() {
    if (!display) return;
    display->clearDisplay();
}

void OLEDDisplay::displayError(const String& errorMessage) {
    if (!display) return;
    
    display->clearDisplay();
    display->setTextSize(1);
    display->setTextColor(SSD1306_WHITE);
    display->setCursor(0, 0);
    display->println(F("ERROR:"));
    display->println(errorMessage);
    display->display();
}