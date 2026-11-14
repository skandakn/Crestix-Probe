# Crestix Probe — ESP32 Physical Flood Rig Sensor Node

This hardware node integrates an **ESP32 development board (ESP-WROOM-32)** with an **HC-SR04 ultrasonic distance transducer** mounted on a vertical gantry probe to measure point water depth over a physical flood basin / water container reservoir.

The hardware pushes real-time telemetry directly to the production web platform at:
`https://crestix-probe-aqua.onrender.com/api/sensor/readings`

---

## 1. Physical Hardware & Bench Setup (as Photographed)

- **Microcontroller:** ESP32 DevKit (ESP-WROOM-32, 30-pin / 38-pin DevKit V1)
- **Primary Transducer:** HC-SR04 Ultrasonic Sensor (4-pin: VCC, Trig, Echo, GND)
- **Power Decoupling:** 1000 µF electrolytic capacitor connected across the 5V/VIN and GND rails (absorbs 2.4 GHz Wi-Fi transmission current spikes to eliminate brownout resets)
- **Target Basin:** Point water elevation station (e.g. Bisleri 20L water container / scaled floodplain channel bed)
- **Mount Configuration:** Fixed vertical probe stalk pointing downward toward the water surface

---

## 2. Wiring & Pinout Diagram

| HC-SR04 Pin | Wire Color (Photo) | ESP32 Pin | Purpose / Notes |
|:---|:---|:---|:---|
| **VCC** | Yellow / Red | **VIN (5V)** | Ultrasonic transducer requires 5V supply for optimal acoustic pulse emission. |
| **GND** | Blue / Black | **GND** | Common ground with ESP32 and filter capacitor. |
| **Trig** | Orange | **GPIO 5** | 10 µs trigger pulse output from ESP32. |
| **Echo** | Red | **GPIO 18** | Echo pulse return (feed through 1kΩ / 2kΩ voltage divider to protect 3.3V input). |
| **Capacitor (+)** | Stripe side (long leg) | **VIN (5V)** | Decoupling capacitor positive terminal. |
| **Capacitor (-)** | Minus stripe (short leg)| **GND** | Decoupling capacitor negative ground rail. |

---

## 3. Water Depth Calculation Formula

The transducer measures the raw vertical air gap distance down to the water surface:
$$\text{Water Depth (cm)} = \max\left(0, \text{Reference Height (cm)} - \text{Measured Distance (cm)}\right)$$

- **Position P1:** Reference Height = `28.0 cm` (Upstream Headwater)
- **Position P2 (Default):** Reference Height = `32.5 cm` (Mid-Basin Channel)
- **Position P3:** Reference Height = `35.0 cm` (Downstream Outflow)

If the sensor face is at 32.5 cm and water rises so the distance to the surface is 22.5 cm, the derived water depth is strictly `10.0 cm`.

---

## 4. Ingestion API Endpoint & Payload Contract

### Endpoint
`POST https://crestix-probe-aqua.onrender.com/api/sensor/readings`

### Ingestion JSON Payload
```json
{
  "experimentId": "EXP-2026-FLOOD-01",
  "deviceId": "ESP32-WROOM-FLOOD-01",
  "firmwareVersion": "v2.5.0-aqua",
  "timestamp": "2026-11-14T21:59:28.000Z",
  "deviceMillis": 45120,
  "position": "P2",
  "sourceMode": "LIVE",
  "measuredDistanceCm": 22.45,
  "referenceHeightCm": 32.50,
  "calculatedWaterDepthCm": 10.05,
  "ambientTemperatureC": 24.2,
  "rssiDbm": -56,
  "faultCode": "NONE"
}
```

---

## 5. Quick Test via Curl

To test ingestion without an ESP32 or before powering on Wi-Fi:
```bash
curl -X POST https://crestix-probe-aqua.onrender.com/api/sensor/readings \
  -H "Content-Type: application/json" \
  -d '{
    "experimentId": "EXP-2026-FLOOD-01",
    "deviceId": "ESP32-WROOM-FLOOD-01",
    "position": "P2",
    "measuredDistanceCm": 22.4,
    "referenceHeightCm": 32.5,
    "sourceMode": "LIVE"
  }'
```

To fetch the latest ingested frame:
```bash
curl https://crestix-probe-aqua.onrender.com/api/sensor/latest?position=P2
```

---

## 6. How to Flash the Firmware

1. Open Arduino IDE or PlatformIO.
2. Install the **ESP32 by Espressif Systems** board package.
3. Select Board: **ESP32 Dev Module** (or NodeMCU-32S).
4. Open `hardware/esp32/firmware/crestix_hcsr04.ino`.
5. Enter your local Wi-Fi SSID and Password:
   ```cpp
   static constexpr char WIFI_SSID[] = "YOUR_WIFI_NAME";
   static constexpr char WIFI_PASSWORD[] = "YOUR_WIFI_PASSWORD";
   ```
6. Click **Upload**.
7. Open Serial Monitor at **115200 baud** to verify connection and live telemetry transmission.
8. Navigate to `https://crestix-probe-aqua.onrender.com/sensors` to watch live hydrograph charts and depth telemetry update in real time!
