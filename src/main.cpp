#include <Arduino.h>
#include <DHT.h>

// Define pin and type
#define DHTPIN 4        // GPIO2
#define DHTTYPE DHT11   // DHT11 sensor

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("DHT11 sensor started...");
}

void loop() {
  delay(2000);  // wait 2 seconds between reads

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Check if readings failed
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %\t");

  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.println(" °C");
}
