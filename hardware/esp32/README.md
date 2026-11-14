# ESP32 floodplain sensor node

The supplied firmware targets the identified HC-SR04 family, using a 10 µs trigger pulse and a protected Echo input. Check the exact board revision's supply/output requirements; do not connect a 5 V Echo directly to ESP32 GPIO. A calibrated station height and real experiment ID are mandatory before readings can be transmitted.

It retains measured range, waits for a full five-sample median window, derives local point depth from the station's calibrated dry-bed reference, and transmits the Member 9 payload with temperature `null` (no temperature sensor model was confirmed). A single probe measures only its mounted station; P1/P2/P3 require separate repeatable placements or probes. Never emit generated values as physical readings.

See [hardware setup](../../../docs/hardware_setup.md) for electrical and calibration safety.
