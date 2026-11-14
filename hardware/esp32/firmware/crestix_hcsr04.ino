#include <Arduino.h>
#include <cstring>
#include <HTTPClient.h>
#include <WiFi.h>
#include <time.h>

// Configure every placeholder from the actual bench setup before flashing.
static constexpr char WIFI_SSID[] = "REPLACE_WIFI_SSID";
static constexpr char WIFI_PASSWORD[] = "REPLACE_WIFI_PASSWORD";
static constexpr char API_URL[] = "http://REPLACE_BACKEND_HOST/api/sensor/readings";
static constexpr char API_KEY[] = "REPLACE_INGEST_API_KEY";
static constexpr char EXPERIMENT_ID[] = "REPLACE_EXPERIMENT_ID";
static constexpr char POSITION[] = "P1";
static constexpr float MOUNT_HEIGHT_CM = 0.0f; // Set from a recorded dry-bed calibration.
static constexpr int TRIG_PIN = 5;
static constexpr int ECHO_PIN = 18; // Must be fed through the documented 5V-to-3.3V divider.
static constexpr uint32_t SAMPLE_PERIOD_MS = 1000;
static constexpr uint32_t ECHO_TIMEOUT_US = 30000;
static constexpr size_t FILTER_WINDOW = 5;

static_assert(FILTER_WINDOW > 0 && FILTER_WINDOW <= 9, "Filter window must be 1..9");
float samples[FILTER_WINDOW];
size_t sampleCount = 0;
size_t sampleCursor = 0;
uint32_t lastSampleMs = 0;

bool configured() {
  return String(WIFI_SSID) != "REPLACE_WIFI_SSID" &&
         String(WIFI_PASSWORD) != "REPLACE_WIFI_PASSWORD" &&
         String(API_URL).indexOf("REPLACE_BACKEND_HOST") < 0 &&
         String(API_KEY) != "REPLACE_INGEST_API_KEY" &&
         String(EXPERIMENT_ID).startsWith("REPLACE_") == false &&
         POSITION[0] != '\0' && MOUNT_HEIGHT_CM > 0.0f;
}

String isoTimestamp() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 1000)) return String();
  char timestamp[25];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(timestamp);
}

bool measureDistanceCm(float &distanceCm) {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10); // HC-SR04 trigger pulse.
  digitalWrite(TRIG_PIN, LOW);
  const uint32_t duration = pulseIn(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
  if (duration == 0) return false;
  distanceCm = duration * 0.0343f / 2.0f;
  // Reject ranges outside the commonly specified HC-SR04 range; never clamp a timeout to zero.
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
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.setTimeout(5000);
  if (!http.begin(API_URL)) return;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  String body = "{\"device_id\":\"crestix-esp32-01\",\"experiment_id\":\"" + String(EXPERIMENT_ID) +
      "\",\"position\":\"" + String(POSITION) +
      "\",\"location_id\":\"" + String(POSITION) +
      "\",\"timestamp\":\"" + timestamp +
      "\",\"distance_cm\":" + String(distanceCm, 2) +
      ",\"water_depth_cm\":" + String(waterDepthCm, 2) +
      ",\"ambient_temperature_c\":null,\"temperature_c\":null,\"quality_status\":\"valid\",\"mount_height_cm\":" + String(MOUNT_HEIGHT_CM, 2) +
      ",\"calibration_offset_cm\":0.0}";
  const int status = http.POST(body);
  Serial.printf("Sensor POST status: %d\n", status);
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  if (!configured()) {
    Serial.println("Configuration required: credentials, API, experiment, station and calibrated mount height.");
    return;
  }
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(250);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void loop() {
  if (!configured() || WiFi.status() != WL_CONNECTED || millis() - lastSampleMs < SAMPLE_PERIOD_MS) return;
  lastSampleMs = millis();
  float distanceCm;
  if (!measureDistanceCm(distanceCm)) {
    Serial.println("Invalid ultrasonic echo; reading not transmitted.");
    return;
  }
  samples[sampleCursor] = distanceCm;
  sampleCursor = (sampleCursor + 1) % FILTER_WINDOW;
  if (sampleCount < FILTER_WINDOW) ++sampleCount;
  // Wait for a full filter window so startup transients are never reported as validated depth.
  if (sampleCount < FILTER_WINDOW) return;
  const float filteredDistanceCm = medianDistance();
  const float waterDepthCm = MOUNT_HEIGHT_CM - filteredDistanceCm;
  if (waterDepthCm < 0.0f) {
    Serial.println("Distance exceeds calibrated dry-bed reference; reading not transmitted.");
    return;
  }
  const String timestamp = isoTimestamp();
  if (timestamp.isEmpty()) {
    Serial.println("Clock is not synchronized; reading not transmitted.");
    return;
  }
  Serial.printf("Measured distance %.2f cm, derived point depth %.2f cm\n", filteredDistanceCm, waterDepthCm);
  postReading(filteredDistanceCm, waterDepthCm, timestamp);
}
