# HC-SR04 to ESP32 wiring

For the commonly documented 5 V HC-SR04, power VCC from 5 V and join sensor GND to ESP32 GND. Connect ESP32 GPIO5 to Trig. Protect Echo with a divider: Echo → 1 kΩ → GPIO18; connect GPIO18 through 2 kΩ to GND. This produces approximately 3.3 V from a 5 V Echo high. A suitable level shifter may be used instead. Do not connect 5 V Echo directly to an ESP32 input. Verify the actual board output and divider voltage with a meter before connecting GPIO. Keep all electronics above and away from water.
