import { SensorNodeTelemetry } from "../types";

export interface HardwareComponent {
  subsystem: string;
  name: string;
  partNumber: string;
  specifications: string[];
  role: string;
}

export const HARDWARE_COMPONENTS: HardwareComponent[] = [
  {
    subsystem: "Compute Core",
    name: "Espressif ESP32-WROOM-32D",
    partNumber: "ESP32-D0WDQ6-V3",
    specifications: [
      "Dual-core Xtensa® 32-bit LX6 microprocessor @ 240 MHz",
      "520 KB SRAM, 4 MB SPI Flash storage",
      "Ultra-Low Power (ULP) coprocessor for sub-15µA sleep gating",
      "Hardware cryptographic acceleration (AES-256, SHA-2, RSA-4096)",
    ],
    role: "Manages sensor sampling, acoustic pulse timing, local Kalman filtering, and encrypted telemetry dispatch.",
  },
  {
    subsystem: "Acoustic Transducer",
    name: "Industrial Weatherproof Ultrasonic Sensor",
    partNumber: "JSN-SR04T-2.0 / AJ-SR04M",
    specifications: [
      "Operating Range: 20 cm to 450 cm (0.2 m to 4.5 m)",
      "Measurement Resolution: ±2 mm calibrated acoustic precision",
      "Transducer IP Rating: IP67 hermetically sealed against total immersion",
      "Integrated NTC thermistor: ambient speed-of-sound correction [v = 331.3 + 0.606·T]",
    ],
    role: "Non-contact time-of-flight acoustic ranging measuring surface water height beneath bridges, culverts, and canal ceilings.",
  },
  {
    subsystem: "Wireless Telemetry",
    name: "Dual-Path LoRaWAN & Cellular NB-IoT",
    partNumber: "SX1262 + Quectel BG95-M3",
    specifications: [
      "LoRaWAN 868 / 915 MHz with +22 dBm output power (up to 12 km line-of-sight)",
      "Cellular Cat-M1 / NB-IoT multi-band fallback for non-gateway urban basins",
      "Encrypted payload: AES-128 LoRaWAN / TLS 1.3 MQTT for cloud ingestion",
      "On-board PCB helical antenna + SMA external waterproof whip connector",
    ],
    role: "Guarantees reliable storm-resilient telemetry transport even during cellular grid brownouts.",
  },
  {
    subsystem: "Power & Harvesting",
    name: "Solar Energy Harvesting & LiFePO4",
    partNumber: "CN3791 MPPT + 18650 LiFePO4",
    specifications: [
      "3.2V 3200 mAh Lithium Iron Phosphate (LiFePO4) cell (-20°C to +65°C safe)",
      "2.5W Monocrystalline outdoor solar panel with UV-stabilized polycarbonate",
      "CN3791 Maximum Power Point Tracking (MPPT) solar charger (93% efficiency)",
      "Autonomous reserve: 180 days continuous operation in total darkness",
    ],
    role: "Provides complete zero-maintenance off-grid power autonomy throughout multi-year field deployments.",
  },
];

export const SAMPLE_SERIAL_PACKETS = [
  {
    timestamp: "13:24:02.108",
    topic: "crestix/cx-01/telemetry",
    payload: {
      node_id: "CX-NODE-01",
      hw_rev: "v1.4",
      datum_m: 12.400,
      tof_us: 18742,
      temp_c: 21.4,
      water_depth_m: 0.762,
      rate_rise_cm_h: 18.4,
      batt_mv: 3340,
      rssi_dbm: -82,
      snr_db: 9.2,
      sample_mode: "BURST_STORM",
      crc_ok: true,
    },
  },
  {
    timestamp: "13:24:12.115",
    topic: "crestix/cx-02/telemetry",
    payload: {
      node_id: "CX-NODE-02",
      hw_rev: "v1.4",
      datum_m: 8.200,
      tof_us: 14210,
      temp_c: 21.6,
      water_depth_m: 0.884,
      rate_rise_cm_h: 24.1,
      batt_mv: 3315,
      rssi_dbm: -74,
      snr_db: 11.4,
      sample_mode: "BURST_STORM",
      crc_ok: true,
    },
  },
  {
    timestamp: "13:24:22.129",
    topic: "crestix/cx-03/telemetry",
    payload: {
      node_id: "CX-NODE-03",
      hw_rev: "v1.4",
      datum_m: 6.800,
      tof_us: 12890,
      temp_c: 21.1,
      water_depth_m: 0.952,
      rate_rise_cm_h: 31.8,
      batt_mv: 3380,
      rssi_dbm: -69,
      snr_db: 12.1,
      sample_mode: "BURST_STORM",
      crc_ok: true,
    },
  },
];

export const PROTOTYPE_METRICS = {
  totalNodesFieldTested: 16,
  firmwareVersion: "CX-OS 1.4.2-LTS",
  transducerFrequency: "40 kHz",
  detectionLatency: "< 4.8 seconds from wave front",
  enclosureRating: "IP68 Submersible Electronics Box",
};
