# Sensors Feature Module

- **Owner**: Member 5
- **Route**: `/sensors`
- **Scope**:
  - Live sensor telemetry grid (LiDAR, Spectrometer, Magnetometer, Thermocouples)
  - Raw packet stream decoding and signal noise filtering
  - Hardware health matrix and sensor calibration triggers
- **Contracts**:
  - Use UI components from `@/components/ui`
  - API endpoint: `/api/sensors/stream`
  - Color conventions: Teal calibrated status, Cyan active stream, Slate standby
