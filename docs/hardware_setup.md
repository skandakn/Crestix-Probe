# Hardware setup and safety

## Identify before wiring

The user identified the available ultrasonic module as HC-SR04. Board revisions and clones vary, so verify its supply and output level before wiring. The commonly documented 5 V HC-SR04 requires a trigger pulse of at least 10 µs and returns a 5 V Echo pulse; protect the ESP32 input. Do not connect a 5 V Echo directly to GPIO.

For a verified 5 V Echo output, the firmware pin map uses a divider: HC-SR04 Echo → 1 kΩ → ESP32 Echo GPIO; from that GPIO node use 2 kΩ to common ground (about 3.3 V from a 5 V high). Or use a direction-appropriate level shifter. Power the common HC-SR04 board from 5 V; share ground with ESP32. Verify the divided high level with a meter before connecting GPIO. HC-SR04 Trig is driven from a 3.3 V ESP32 output; confirm the board recognizes it before unattended operation.

Keep the ESP32, breadboard, power supply, and all exposed conductors above and away from the basin. Use a rigid mount that holds the transducer vertical and prevents movement during each trial. Protect the sensor from splashes; do not immerse a non-waterproof module. Route wires with strain relief and provide a drip loop.

## Calibration

At each station (P1, P2, P3), measure the vertical distance from the transducer face to the dry bed using a ruler. Record station, reference height, date, sensor model/revision, mounting arrangement, and operator in a calibration record. Repeat the dry measurement after moving the mount. Derive water depth as `max(0, reference_height_cm - distance_cm)`. Retain raw distance; never overwrite it with derived depth. Mark readings invalid when the echo times out, is outside the sensor's documented range, or the fixture has moved. Do not treat a clamped zero as a valid zero-depth observation.

Temperature compensation is optional and must only be enabled when the installed temperature sensor model and wiring are confirmed. Do not use ambient temperature as water temperature without recording that limitation.

## Telemetry

The existing backend owns `POST /api/sensor/readings`, `GET /api/sensor/latest`, and `GET /api/sensor/history`. It persists raw distance, derived depth, station, experiment, timestamp and calibration metadata. Follow `backend/docs/API.md` and `src/features/sensors/PAYLOAD_CONTRACT.md`; coordinate schema changes with Member 9 instead of adding a second ingestion path. The current backend example is illustrative documentation, not a physical measurement.
