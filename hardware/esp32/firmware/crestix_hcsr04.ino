/**
 * CRESTIX PROBE — PHYSICAL FLOOD RIG TELEMETRY FIRMWARE
 * Target Node: ESP32 (ESP-WROOM-32 DevKit, 30/38 pin)
 * Sensor: HC-SR04 / JSN-SR04T Ultrasonic Distance Transducer
 * Ingestion Target: https://crestix-probe-aqua.onrender.com/api/sensor/readings
 *
 * Hardware Pinout (as per bench build):
 * - HC-SR04 VCC   -> ESP32 5V (VIN / V5)
 * - HC-SR04 GND   -> ESP32 GND
 * - HC-SR04 Trig  -> ESP32 GPIO 5 (or GPIO 13)
 * - HC-SR04 Echo  -> ESP32 GPIO 18 (via 1k/2k resistor voltage divider to 3.3V)
 * - Power Filter  -> 1000 µF electrolytic capacitor across 5V/VIN & GND rail
 * - Built-in LED  -> GPIO 2 (Heartbeat & transmit pulse indicator)
 */

#include <Arduino.h>
#include <cstring>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

// Wi-Fi Configuration — Set your local 2.4GHz Wi-Fi credentials here:
static constexpr char WIFI_SSID[] = "REPLACE_WIFI_SSID";
static constexpr char WIFI_PASSWORD[] = "REPLACE_WIFI_PASSWORD";

// Live Crestix Probe Cloud Ingestion Endpoint:
static constexpr char API_URL[] = "https://crestix-probe-aqua.onrender.com/api/sensor/readings";
static constexpr char API_KEY[] = ""; // Optional ingest auth token (leave empty if open)

// Operational Station & Calibration Defaults:
static constexpr char EXPERIMENT_ID[] = "EXP-2026-FLOOD-01";
static constexpr char DEVICE_ID[] = "ESP32-WROOM-FLOOD-01";
static constexpr char FIRMWARE_VERSION[] = "v2.5.0-aqua";
static constexpr char POSITION[] = "P2"; // "P1" (28.0 cm), "P2" (32.5 cm), or "P3" (35.0 cm)
static constexpr float MOUNT_HEIGHT_CM = 32.5f; // P2 dry-bed reference height

// Hardware Pin Configuration:
static constexpr int TRIG_PIN = 5;
static constexpr int ECHO_PIN = 18;
static constexpr int LED_PIN = 2; // Onboard blue LED

// Sampling & Filtering Parameters:
static constexpr uint32_t SAMPLE_PERIOD_MS = 1500;
static constexpr uint32_t ECHO_TIMEOUT_US = 35000; // ~6 meters max roundtrip
static constexpr size_t FILTER_WINDOW = 5;

float samples[FILTER_WINDOW];
size_t sampleCount = 0;
size_t sampleCursor = 0;
uint32_t lastSampleMs = 0;

String isoTimestamp() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 1000)) {
    // If NTP has not synced yet, generate relative uptime timestamp
    char fallback[32];
    snprintf(fallback, sizeof(fallback), "1970-01-01T00:00:%02u.%03uZ", 
             (unsigned)(millis() / 1000), (unsigned)(millis() % 1000));
    return String(fallback);
  }
  char timestamp[32];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(timestamp);
}

bool measureDistanceCm(float &distanceCm) {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10); // HC-SR04 trigger pulse
  digitalWrite(TRIG_PIN, LOW);

  const uint32_t duration = pulseIn(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
  if (duration == 0) return false;

  // Approximate speed of sound at ~24°C: 345.5 m/s -> 0.03455 cm/µs
  distanceCm = duration * 0.03455f / 2.0f;
  return distanceCm >= 2.0f && distanceCm <= 400.0f;
}

float medianDistance() {
  float ordered[FILTER_WINDOW];
  memcpy(ordered, samples, sampleCount * sizeof(float));
  for (size_t i = 1; i < sampleCount; ++i) {
    const float value = ordered[i];
    size_t j = i;
    while (j > 0 && ordered[j - 1] > value) { ordered[j] = ordered[j - 1]; --j; }
    ordered[j] = value;
  }
  return ordered[sampleCount / 2];
}

void postReading(float distanceCm, float waterDepthCm, const String &timestamp) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ESP32] Wi-Fi not connected. Skipping upload.");
    return;
  }

  digitalWrite(LED_PIN, HIGH);

  HTTPClient http;
  http.setTimeout(8000);

  bool isHttps = String(API_URL).startsWith("https://");
  bool initSuccess = false;

  WiFiClientSecure secureClient;
  if (isHttps) {
    secureClient.setInsecure(); // Disable strict certificate validation for Render
    initSuccess = http.begin(secureClient, API_URL);
  } else {
    initSuccess = http.begin(API_URL);
  }

  if (!initSuccess) {
    Serial.println("[ESP32] Failed to initialize HTTP client connection.");
    digitalWrite(LED_PIN, LOW);
    return;
  }

  http.addHeader("Content-Type", "application/json");
  if (strlen(API_KEY) > 0) {
    http.addHeader("X-API-Key", API_KEY);
  }

  int rssi = WiFi.RSSI();

  // Dual-schema JSON payload: interoperable with both Next.js App Router and Python FastAPI backends
  String body = "{"
    "\"experimentId\":\"" + String(EXPERIMENT_ID) + "\","
    "\"experiment_id\":\"" + String(EXPERIMENT_ID) + "\","
    "\"deviceId\":\"" + String(DEVICE_ID) + "\","
    "\"device_id\":\"" + String(DEVICE_ID) + "\","
    "\"firmwareVersion\":\"" + String(FIRMWARE_VERSION) + "\","
    "\"firmware_version\":\"" + String(FIRMWARE_VERSION) + "\","
    "\"timestamp\":\"" + timestamp + "\","
    "\"deviceMillis\":" + String(millis()) + ","
    "\"device_millis\":" + String(millis()) + ","
    "\"position\":\"" + String(POSITION) + "\","
    "\"location_id\":\"" + String(POSITION) + "\","
    "\"sourceMode\":\"LIVE\","
    "\"source_mode\":\"LIVE\","
    "\"measuredDistanceCm\":" + String(distanceCm, 2) + ","
    "\"distance_cm\":" + String(distanceCm, 2) + ","
    "\"raw_distance_cm\":" + String(distanceCm, 2) + ","
    "\"referenceHeightCm\":" + String(MOUNT_HEIGHT_CM, 2) + ","
    "\"mount_height_cm\":" + String(MOUNT_HEIGHT_CM, 2) + ","
    "\"calculatedWaterDepthCm\":" + String(waterDepthCm, 2) + ","
    "\"water_depth_cm\":" + String(waterDepthCm, 2) + ","
    "\"ambientTemperatureC\":24.2,"
    "\"temperature_c\":24.2,"
    "\"rssiDbm\":" + String(rssi) + ","
    "\"rssi_dbm\":" + String(rssi) + ","
    "\"faultCode\":\"NONE\","
    "\"fault_code\":\"NONE\""
  "}";

  int httpCode = http.POST(body);
  if (httpCode > 0) {
    Serial.printf("[ESP32] Ingestion upload HTTP code: %d | Dist: %.2f cm | Depth: %.2f cm\n", 
                  httpCode, distanceCm, waterDepthCm);
  } else {
    Serial.printf("[ESP32] HTTP POST failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  digitalWrite(LED_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=========================================");
  Serial.println("  CRESTIX PROBE — ESP32 FLOOD RIG NODE   ");
  Serial.println("  Firmware: " + String(FIRMWARE_VERSION));
  Serial.println("  Ingestion Target: " + String(API_URL));
  Serial.println("=========================================\n");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  if (String(WIFI_SSID) == "REPLACE_WIFI_SSID") {
    Serial.println("[WARNING] Please update WIFI_SSID & WIFI_PASSWORD with your credentials.");
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[ESP32] Connecting to Wi-Fi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);
    Serial.printf("\n[ESP32] Wi-Fi connected! IP: %s (RSSI: %d dBm)\n", 
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println("\n[ESP32] Wi-Fi connection timed out. Will retry in main loop.");
  }
}

void loop() {
  // Wi-Fi auto-reconnect logic
  if (WiFi.status() != WL_CONNECTED && String(WIFI_SSID) != "REPLACE_WIFI_SSID") {
    static uint32_t lastReconnectAttempt = 0;
    if (millis() - lastReconnectAttempt > 10000) {
      lastReconnectAttempt = millis();
      Serial.println("[ESP32] Reconnecting to Wi-Fi...");
      WiFi.reconnect();
    }
  }

  if (millis() - lastSampleMs < SAMPLE_PERIOD_MS) {
    return;
  }
  lastSampleMs = millis();

  float distanceCm = 0.0f;
  if (!measureDistanceCm(distanceCm)) {
    Serial.println("[ESP32] HC-SR04 echo timeout or out of range (2-400 cm).");
    return;
  }

  // Ring buffer median filter to suppress acoustic surface jitter
  samples[sampleCursor] = distanceCm;
  sampleCursor = (sampleCursor + 1) % FILTER_WINDOW;
  if (sampleCount < FILTER_WINDOW) ++sampleCount;
  if (sampleCount < FILTER_WINDOW) return;

  const float filteredDistanceCm = medianDistance();
  // Hydrodynamic point depth calculation: Reference Height - Measured Distance
  float waterDepthCm = MOUNT_HEIGHT_CM - filteredDistanceCm;
  if (waterDepthCm < 0.0f) {
    waterDepthCm = 0.0f; // Clamped at dry bed
  }

  const String timestamp = isoTimestamp();
  postReading(filteredDistanceCm, waterDepthCm, timestamp);
}
