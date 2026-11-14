"""
Real-Time 1D Kalman Filter and Median Ring Buffer for In-Situ ESP32 Telemetry.
Part of the Crestix Probe Edge-to-Cloud Data Assimilation Pipeline.

Filters raw acoustic time-of-flight measurements from HC-SR04 / JSN-SR04T sensors:
- Rejects spurious multipath echoes, surface foam scattering, and turbulence ripple spikes
- 5-Point Median Ring Buffer for outlier isolation
- State space formulation:
    x_k = x_{k-1} + v_{k-1} * dt + w_k  (Process Model)
    z_k = x_k + v_k                     (Measurement Model)
- Real-time thermodynamic acoustic velocity compensation:
    v_sound(T) = 331.3 + 0.606 * T [m/s]
- Fuses continuous acoustic ranging with discrete 6-pin galvanic contact triggers
"""

from typing import List, Dict, Optional, Tuple, Any
import math
import json


class InSituSensorKalmanFilter:
    def __init__(
        self,
        initial_depth_cm: float = 0.0,
        process_variance_q: float = 0.05,
        measurement_variance_r: float = 0.85,
        ring_buffer_size: int = 5,
        datum_height_cm: float = 28.63
    ):
        self.datum_cm = datum_height_cm
        self.q = process_variance_q
        self.r = measurement_variance_r
        self.buffer_size = ring_buffer_size

        # State estimate and error covariance
        self.x_hat = initial_depth_cm
        self.p_cov = 1.0

        # Ring buffer for median noise suppression
        self.median_buffer: List[float] = [initial_depth_cm]

    def update_speed_of_sound(self, ambient_temp_c: float) -> float:
        """Calculates temperature-corrected acoustic velocity in air (m/s)."""
        return 331.3 + 0.606 * ambient_temp_c

    def median_filter_sample(self, raw_cm: float) -> float:
        """Appends raw measurement and returns 5-point median."""
        self.median_buffer.append(raw_cm)
        if len(self.median_buffer) > self.buffer_size:
            self.median_buffer.pop(0)

        sorted_vals = sorted(self.median_buffer)
        mid = len(sorted_vals) // 2
        return sorted_vals[mid]

    def filter_measurement(
        self,
        raw_depth_cm: float,
        dt_seconds: float = 1.0
    ) -> Dict[str, float]:
        """
        Executes Predict and Update stages of the 1D Kalman Filter.
        """
        # Step 1: Median Outlier Rejection
        cleaned_z = self.median_filter_sample(raw_depth_cm)

        # Step 2: Time Update (Predict)
        x_pred = self.x_hat
        p_pred = self.p_cov + self.q * dt_seconds

        # Step 3: Measurement Update (Correct)
        kalman_gain = p_pred / (p_pred + self.r)
        self.x_hat = x_pred + kalman_gain * (cleaned_z - x_pred)
        self.p_cov = (1.0 - kalman_gain) * p_pred

        # Physical container bounding: [0, datum_height]
        self.x_hat = max(0.0, min(self.datum_cm, self.x_hat))
        air_gap_cm = max(0.0, self.datum_cm - self.x_hat)

        return {
            "filtered_water_depth_cm": round(self.x_hat, 2),
            "measured_air_gap_cm": round(air_gap_cm, 2),
            "kalman_gain": round(kalman_gain, 4),
            "estimated_error_covariance": round(self.p_cov, 4),
            "raw_measurement_cm": raw_depth_cm,
            "median_cleaned_cm": cleaned_z
        }

    def fuse_with_galvanic_pins(
        self,
        filtered_depth_cm: float,
        pin_states: List[int],
        pin_thresholds_cm: List[float]
    ) -> Dict[str, Any]:
        """
        Fuses continuous acoustic sonar estimation with discrete 6-pin contact ground truth.
        Detects acoustic drift if ultrasonic sonar disagrees with submerged contact pins.
        """
        highest_submerged_pin_cm = 0.0
        active_pins_count = sum(1 for p in pin_states if p > 0)

        for i, (is_wet, threshold) in enumerate(zip(pin_states, pin_thresholds_cm)):
            if is_wet > 0 and threshold > highest_submerged_pin_cm:
                highest_submerged_pin_cm = threshold

        # Discrepancy check: If Pin 3 (14.3 cm) is submerged but sonar says 8 cm, acoustic deflection detected!
        sonar_pin_discrepancy_cm = round(filtered_depth_cm - highest_submerged_pin_cm, 2)
        has_sensor_anomaly = (
            highest_submerged_pin_cm > 0.0 and filtered_depth_cm < (highest_submerged_pin_cm - 3.5)
        )

        fused_depth_cm = (
            max(filtered_depth_cm, highest_submerged_pin_cm)
            if has_sensor_anomaly
            else filtered_depth_cm
        )

        return {
            "fused_water_depth_cm": round(fused_depth_cm, 2),
            "acoustic_depth_cm": round(filtered_depth_cm, 2),
            "highest_submerged_pin_cm": highest_submerged_pin_cm,
            "active_pins_count": active_pins_count,
            "discrepancy_cm": sonar_pin_discrepancy_cm,
            "sensor_health": "DEGRADED_ACOUSTIC_DEFLECTION" if has_sensor_anomaly else "OPTIMAL_DUAL_FUSION"
        }


if __name__ == "__main__":
    kf = InSituSensorKalmanFilter(initial_depth_cm=14.2)
    # Simulate a noisy ultrasonic wave reading
    noisy_readings = [14.1, 14.3, 21.0, 14.5, 14.4, 14.6]  # 21.0 is a false acoustic reflection
    pins = [1, 1, 1, 0, 0, 0]
    pin_thresh = [4.8, 9.5, 14.3, 19.1, 23.9, 28.6]

    print("=== Crestix Probe: In-Situ Kalman Filter & Dual-Sensor Fusion ===")
    for reading in noisy_readings:
        filt = kf.filter_measurement(reading)
        fused = kf.fuse_with_galvanic_pins(filt["filtered_water_depth_cm"], pins, pin_thresh)
        print(f"Raw: {reading} cm -> Filtered: {filt['filtered_water_depth_cm']} cm | Fused: {fused['fused_water_depth_cm']} cm ({fused['sensor_health']})")
