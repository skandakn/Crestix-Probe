# ESP32 floodplain sensor node

Firmware is intentionally not supplied until the actual ultrasonic module and revision are identified. The repository mentions HC-SR04, JSN-SR04T, and JSN-SR04T-2.0/AJ-SR04M; their operating ranges, electrical behavior, and timing requirements must not be assumed interchangeable. Confirm the model from the physical label and datasheet before selecting a driver or connecting Echo to GPIO.

After identification, the firmware implementation should retain raw range and timestamp, apply a documented median/outlier filter, derive local point depth from the station's calibrated dry-bed reference, optionally read only the confirmed temperature sensor, and transmit the Member 9 payload. A single probe measures only its mounted station; P1/P2/P3 require separate repeatable placements or probes. Never emit generated values as physical readings.

See [hardware setup](../../../docs/hardware_setup.md) for electrical and calibration safety.
