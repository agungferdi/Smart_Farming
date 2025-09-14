#ifndef SLEEP_MANAGER_H
#define SLEEP_MANAGER_H

#include <Arduino.h>
#include "RTClib.h"
#include "esp_sleep.h"
#include <Wire.h>

struct Schedule {
    int hour;
    int minute;
    int duration;
};

class SleepManager {
private:
    RTC_DS3231 rtc;
    static const int MAX_SCHEDULES = 10;
    Schedule schedules[MAX_SCHEDULES];
    int scheduleCount;
    int lastSession;
    unsigned long lastStatusPrint;
    
    static const uint64_t uS_TO_S_FACTOR = 1000000ULL;
    
public:
    SleepManager();
    bool begin();
    void addSchedule(int hour, int minute, int duration);
    void setDefaultSchedule();
    bool isInActiveSession();
    bool shouldRun();
    void updateLastRun();
    void sleepUntilNext();
    bool shouldSleepOnBoot();
    int findCurrentSession();
    int findNextSession();
    void checkAndSleep();
    void printCurrentStatus();
    DateTime getCurrentTime();
    void syncTimeWithNTP(unsigned long epochTime);
    void syncTimeWithNTP(int hour, int minute, int second, int day, int month, int year);
};

#endif
