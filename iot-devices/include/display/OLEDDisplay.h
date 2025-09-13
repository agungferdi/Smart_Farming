#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <Wire.h>

class OLEDDisplay {
private:
    Adafruit_SSD1306* display; // Use pointer instead of object
    int sdaPin;
    int sclPin;
    const int SCREEN_WIDTH = 128;
    const int SCREEN_HEIGHT = 64;
    const int SCREEN_ADDRESS = 0x3C;
    const int OLED_RESET = -1;

public:
    OLEDDisplay(int sdaPin, int sclPin);
    ~OLEDDisplay(); // Add destructor
    bool begin();
    void showStartupMessage();
    void updateSensorData(float temp, float humidity, int soilMoisture, float soilTemp,
                         String waterLevel, bool rain, bool pumpActive, bool wifiConnected);
    void clearDisplay();
    void displayError(const String& errorMessage);
};

#endif
