#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://crestix-probe-aqua.onrender.com/api/sensor/readings";
const char* nodeId = "river_sensor_alpha";
const char* experimentId = "EXP-2026-FLOOD-01";
const float latitude = 12.9716;
const float longitude = 77.5946;

const int probePins[6] = {25, 13, 14, 21, 32, 33};
const int trigPin = 26;
const int echoPin = 27;
const int oneWireBus = 4;

OneWire oneWire(oneWireBus);
DallasTemperature sensors(&oneWire);

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1500;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 6; i++) {
    pinMode(probePins[i], INPUT_PULLUP);
  }
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  sensors.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected!");
}

float getUltrasonicDepth() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 0.0;
  float distanceCm = duration * 0.034 / 2.0;
  float totalHeightCm = 28.63; // Calibrated floor offset
  float waterDepth = totalHeightCm - distanceCm;
  return (waterDepth < 0) ? 0 : waterDepth;
}

void loop() {
  if (millis() - lastSendTime < sendInterval) {
    return;
  }
  lastSendTime = millis();

  float depthCm = getUltrasonicDepth();
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  int activeProbes = 0;
  for (int i = 0; i < 6; i++) {
    if (digitalRead(probePins[i]) == LOW) {
      activeProbes++;
    }
  }

  Serial.printf("Depth: %.2f cm | Temp: %.2f C | Probes: %d/6\n", depthCm, tempC, activeProbes);

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    if (http.begin(client, serverUrl)) {
      http.addHeader("Content-Type", "application/json");

      JsonDocument doc;
      doc["experimentId"] = experimentId;
      doc["deviceId"] = nodeId;
      doc["position"] = "P2";
      doc["waterDepthCm"] = depthCm;
      doc["temperatureC"] = tempC;
      doc["activeProbes"] = activeProbes;
      doc["latitude"] = latitude;
      doc["longitude"] = longitude;

      String payload;
      serializeJson(doc, payload);
      int httpCode = http.POST(payload);
      Serial.printf("POST %s -> %d\n", serverUrl, httpCode);
      http.end();
    }
  }
}
