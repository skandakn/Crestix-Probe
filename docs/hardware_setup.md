# Hardware setup and safety

## Identify before wiring

The repository currently names several incompatible ultrasonic modules: HC-SR04, JSN-SR04T, and JSN-SR04T-2.0/AJ-SR04M. Read the exact model and revision from the board or transducer label and obtain that revision's datasheet before choosing supply voltage, trigger pulse, echo timing, minimum range, or wiring. Do not connect an unidentified Echo output to an ESP32.

Many common HC-SR04 boards are powered at 5 V and produce a 5 V Echo signal. ESP32 GPIO is not 5 V tolerant. For a confirmed 5 V Echo output, use a suitable logic-level shifter or a divider sized for the ESP32 input range; connect grounds together. Never infer output voltage solely from the product family name. Verify the measured Echo high voltage with a meter before connecting GPIO.

Keep the ESP32, breadboard, power supply, and all exposed conductors above and away from the basin. Use a rigid mount that holds the transducer vertical and prevents movement during each trial. Protect the sensor from splashes; do not immerse a non-waterproof module. Route wires with strain relief and provide a drip loop.

## Calibration

At each station (P1, P2, P3), measure the vertical distance from the transducer face to the dry bed using a ruler. Record station, reference height, date, sensor model/revision, mounting arrangement, and operator in a calibration record. Repeat the dry measurement after moving the mount. Derive water depth as `max(0, reference_height_cm - distance_cm)`. Retain raw distance; never overwrite it with derived depth. Mark readings invalid when the echo times out, is outside the sensor's documented range, or the fixture has moved. Do not treat a clamped zero as a valid zero-depth observation.

Temperature compensation is optional and must only be enabled when the installed temperature sensor model and wiring are confirmed. Do not use ambient temperature as water temperature without recording that limitation.

## Telemetry

The existing backend owns `POST /api/sensor/readings`, `GET /api/sensor/latest`, and `GET /api/sensor/history`. It persists raw distance, derived depth, station, experiment, timestamp and calibration metadata. Follow `backend/docs/API.md` and `src/features/sensors/PAYLOAD_CONTRACT.md`; coordinate schema changes with Member 9 instead of adding a second ingestion path. The current backend example is illustrative documentation, not a physical measurement.
