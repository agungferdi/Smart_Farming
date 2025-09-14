#include "utils/SleepManager.h"
#include <WiFi.h>
#include "esp_bt.h"

SleepManager::SleepManager() : scheduleCount(0), lastSession(-1), lastStatusPrint(0) {
}

bool SleepManager::begin() {
    Wire.begin();
        
    if (!rtc.begin()) {
        Serial.println("DS3231 RTC not found!");
        return false;
    }
        
    Serial.println("DS3231 RTC initialized successfully");
    
    DateTime utcNow = rtc.now();
    DateTime localTime = DateTime(utcNow.unixtime() + 7 * 3600); // Convert to UTC+7
    Serial.printf("Local Time (UTC+7): %02d:%02d:%02d on %02d/%02d/%d\n", 
                 localTime.hour(), localTime.minute(), localTime.second(),
                 localTime.day(), localTime.month(), localTime.year());
        
    if (rtc.lostPower() || utcNow.year() < 2025) {
        Serial.println("RTC lost power or invalid time, setting to compile time...");
        DateTime compileTime = DateTime(F(__DATE__), F(__TIME__));
        rtc.adjust(compileTime);
        Serial.printf("RTC updated to compile time: %02d:%02d:%02d\n", 
                     compileTime.hour(), compileTime.minute(), compileTime.second());
    }
    
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    
    if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
        Serial.println("WOKE UP from scheduled sleep - IRRIGATION TIME!");
    } else {
        Serial.println("FIRST BOOT - checking irrigation schedule...");
    }
    
    return true;
}

void SleepManager::addSchedule(int hour, int minute, int duration) {
    if (scheduleCount < MAX_SCHEDULES) {
        schedules[scheduleCount].hour = hour;
        schedules[scheduleCount].minute = minute;
        schedules[scheduleCount].duration = duration;
        scheduleCount++;
    }
}

void SleepManager::setDefaultSchedule() {
    scheduleCount = 0;
    
    addSchedule(19, 12, 3);
    addSchedule(19, 17, 3);
    addSchedule(18, 21, 3);
    addSchedule(18, 24, 10);

    Serial.println("Default irrigation schedule loaded (Local Time UTC+7):");
    for (int i = 0; i < scheduleCount; i++) {
        Serial.printf("Session %d: %02d:%02d (%d min)\n", 
                     i + 1, schedules[i].hour, schedules[i].minute, schedules[i].duration);
    }
}

int SleepManager::findCurrentSession() {
    if (scheduleCount == 0) return -1;
    
    DateTime utcNow = rtc.now();
    DateTime now = DateTime(utcNow.unixtime() + 7 * 3600);
    int currentTime = now.hour() * 60 + now.minute();
    
    for (int i = 0; i < scheduleCount; i++) {
        int sessionStart = schedules[i].hour * 60 + schedules[i].minute;
        int sessionEnd = sessionStart + schedules[i].duration;
        
        if (currentTime >= sessionStart && currentTime < sessionEnd) {
            return i;
        }
    }
    return -1;
}

int SleepManager::findNextSession() {
    if (scheduleCount == 0) return -1;
    
    DateTime utcNow = rtc.now();
    DateTime now = DateTime(utcNow.unixtime() + 7 * 3600);
    int currentTime = now.hour() * 60 + now.minute();
    
    for (int i = 0; i < scheduleCount; i++) {
        int sessionStart = schedules[i].hour * 60 + schedules[i].minute;
        
        if (currentTime < sessionStart) {
            return i;
        }
    }
    return 0;
}

bool SleepManager::isInActiveSession() {
    return findCurrentSession() >= 0;
}

void SleepManager::checkAndSleep() {
    DateTime utcNow = rtc.now();
    DateTime now = DateTime(utcNow.unixtime() + 7 * 3600);
    int nextSession = findNextSession();
    int nextHour = schedules[nextSession].hour;
    int nextMinute = schedules[nextSession].minute;
    
    int currentTotalMinutes = now.hour() * 60 + now.minute();
    int nextTotalMinutes = nextHour * 60 + nextMinute;
    
    if (nextTotalMinutes <= currentTotalMinutes) {
        nextTotalMinutes += 24 * 60;
    }
    
    int sleepMinutes = nextTotalMinutes - currentTotalMinutes;
    
    Serial.printf("Sleep until next irrigation: %02d:%02d (%d minutes)\n", 
                 nextHour, nextMinute, sleepMinutes);
    
    WiFi.mode(WIFI_OFF);
    btStop();
    
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_FAST_MEM, ESP_PD_OPTION_OFF);
    
    uint64_t sleepTime = sleepMinutes * 60 * uS_TO_S_FACTOR;
    esp_sleep_enable_timer_wakeup(sleepTime);
    
    Serial.println("ENTERING DEEP SLEEP!");
    Serial.flush();
    delay(1000);
    
    esp_deep_sleep_start();
}

bool SleepManager::shouldSleepOnBoot() {
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    
    if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
        return false;
    }
    
    int currentSession = findCurrentSession();
    if (currentSession >= 0) {
        Serial.println("First boot during irrigation time - staying awake");
        return false;
    }
    
    Serial.println("First boot outside irrigation time - going to sleep");
    return true;
}

void SleepManager::printCurrentStatus() {
    if (millis() - lastStatusPrint >= 30000) {
        DateTime utcNow = rtc.now();
        DateTime now = DateTime(utcNow.unixtime() + 7 * 3600);
        
        Serial.printf("Local Time: %02d:%02d:%02d ", 
                     now.hour(), now.minute(), now.second());
        
        int currentSession = findCurrentSession();
        if (currentSession >= 0) {
            int remaining = schedules[currentSession].duration - 
                           ((now.hour() * 60 + now.minute()) - 
                            (schedules[currentSession].hour * 60 + schedules[currentSession].minute));
            Serial.printf("- IRRIGATING (Session %d, %d min left)\n", 
                         currentSession + 1, remaining);
        } else {
            int nextSession = findNextSession();
            Serial.printf("- Waiting (Next: %02d:%02d)\n", 
                         schedules[nextSession].hour, schedules[nextSession].minute);
        }
        
        lastStatusPrint = millis();
    }
}

DateTime SleepManager::getCurrentTime() {
    DateTime utcNow = rtc.now();
    return DateTime(utcNow.unixtime() + 7 * 3600);
}

void SleepManager::syncTimeWithNTP(int hour, int minute, int second, int day, int month, int year) {
    rtc.adjust(DateTime(year, month, day, hour, minute, second));
    Serial.printf("RTC synced with NTP: %02d:%02d:%02d %02d/%02d/%d\n", 
                 hour, minute, second, day, month, year);
}

void SleepManager::syncTimeWithNTP(unsigned long epochTime) {
    DateTime dt(epochTime);
    rtc.adjust(dt);
    
    DateTime localTime = DateTime(epochTime + 7 * 3600);
    Serial.printf("RTC synced with NTP - Local Time (UTC+7): %02d:%02d:%02d %02d/%02d/%d\n", 
                 localTime.hour(), localTime.minute(), localTime.second(), 
                 localTime.day(), localTime.month(), localTime.year());
}

bool SleepManager::shouldRun() {
    DateTime utcNow = rtc.now();
    DateTime now = DateTime(utcNow.unixtime() + 7 * 3600);
    int currentSession = findCurrentSession();
    
    if (currentSession >= 0 && currentSession != lastSession) {
        Serial.printf("Irrigation session %d is active!\n", currentSession + 1);
        return true;
    }
    
    return false;
}

void SleepManager::updateLastRun() {
    DateTime utcNow = rtc.now();
    DateTime now = DateTime(utcNow.unixtime() + 7 * 3600);
    lastSession = findCurrentSession();
    Serial.printf("Session %d completed at %02d:%02d\n", lastSession + 1, now.hour(), now.minute());
}

void SleepManager::sleepUntilNext() {
    checkAndSleep();
}
