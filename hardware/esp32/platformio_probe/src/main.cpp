#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ==========================================
// ⚠️ CRESTIX PROBE HACKATHON CONFIGURATION ⚠️
// ==========================================
const char* ssid = "Shreeyansh";
const char* password = "shree2006";

// Live Render HTTPS Endpoint (Default Production Bridge)
// Or local laptop IP: "http://10.159.108.42:5000/update" or "http://10.159.108.42:3000/update"
const char* serverUrl = "https://crestix-probe-aqua.onrender.com/update";
const char* localBackupUrl = "http://10.159.108.42:5000/update"; 
// ==========================================

const char* nodeId = "river_sensor_alpha";
const float latitude = 12.9716;  
const float longitude = 77.5946; 

const int probePins[6] = {25, 13, 14, 21, 32, 33}; 
const int trigPin = 26;
const int echoPin = 27;
const int oneWireBus = 4;

OneWire oneWire(oneWireBus);
DallasTemperature sensors(&oneWire);

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000; 

void setup() {
  Serial.begin(115200);
  delay(1000);

  for (int i = 0; i < 6; i++) {
    pinMode(probePins[i], INPUT_PULLUP);
  }

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  sensors.begin();

  Serial.println("\n--- Connecting to WiFi ---");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Ingestion Target: ");
  Serial.println(serverUrl);
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
  float totalHeightCm = 28.63; // YOUR CALIBRATED OFFSET
  float waterDepth = totalHeightCm - distanceCm;
  
  if (waterDepth < 0) waterDepth = 0;
  return waterDepth;
}

bool postPayload(const char* url, const String& jsonString) {
  HTTPClient http;
  bool isHttps = strncmp(url, "https://", 8) == 0;
  
  if (isHttps) {
    WiFiClientSecure client;
    client.setInsecure(); // Skip SSL certificate verification for cloud Render host
    http.begin(client, url);
  } else {
    WiFiClient client;
    http.begin(client, url);
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(4000);
  
  int httpResponseCode = http.POST(jsonString);
  bool success = (httpResponseCode == 200 || httpResponseCode == 201);
  
  if (success) {
    Serial.printf("✅ Ingested [%s]: %s\n", url, jsonString.c_str());
  } else {
    Serial.printf("❌ Ingestion Failed [%s] (Code: %d)\n", url, httpResponseCode);
  }
  
  http.end();
  return success;
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  int currentProbeState[6];
  for (int i = 0; i < 6; i++) {
    currentProbeState[i] = (digitalRead(probePins[i]) == LOW) ? 1 : 0; 
  }

  float sonicDepth = getUltrasonicDepth();
  sensors.requestTemperatures(); 
  float tempC = sensors.getTempCByIndex(0);

  StaticJsonDocument<256> doc;
  doc["node_id"] = nodeId;
  doc["lat"] = latitude;
  doc["lng"] = longitude;
  
  JsonArray probes = doc.createNestedArray("depth_probes");
  for (int i = 0; i < 6; i++) {
    probes.add(currentProbeState[i]);
  }
  
  doc["depth_sonic"] = sonicDepth;
  doc["temp_c"] = tempC;

  String jsonString;
  serializeJson(doc, jsonString);
  
  // Try Render cloud endpoint first
  bool ok = postPayload(serverUrl, jsonString);
  
  // If cloud fails, fallback to local backup address
  if (!ok && localBackupUrl && strlen(localBackupUrl) > 0) {
    postPayload(localBackupUrl, jsonString);
  }
}

void loop() {
  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    sendDataToServer();
  }
}
