"""ESP32 ultrasonic sensor calibration, depth computation, and quality scoring."""

from typing import Any, Optional

from app.core.config import Settings
from app.core.errors import InvalidPayloadError
from app.schemas import CalibrationMetadata, SensorReadingCreate


def compute_speed_of_sound(temperature_c: Optional[float]) -> float:
    """Compute speed of sound in air (m/s) given temperature in Celsius."""
    temp = 25.0 if temperature_c is None else temperature_c
    return round(331.3 + 0.606 * temp, 2)


def evaluate_sensor_reading(
    payload: SensorReadingCreate,
    settings: Settings,
    experiment_calibration: Optional[dict[str, Any]] = None,
) -> tuple[float, float, str, float, CalibrationMetadata]:
    """Validate sensor physics, compute water depth from raw distance, and assess quality.

    Returns:
        (raw_distance_cm, calculated_depth_cm, quality_flag, quality_score, calibration_metadata)
    """
    exp_cal = experiment_calibration or {}
    mount_height_cm = (
        payload.mount_height_cm
        or exp_cal.get("mount_height_cm")
        or settings.default_mount_height_cm
    )
    offset_cm = (
        payload.calibration_offset_cm
        if payload.calibration_offset_cm != 0.0
        else float(exp_cal.get("offset_cm", 0.0))
    )

    raw_distance = round(float(payload.distance_cm), 4)

    if raw_distance < settings.min_sensor_distance_cm or raw_distance > settings.max_sensor_distance_cm:
        raise InvalidPayloadError(
            message=(
                f"Sensor distance_cm ({raw_distance} cm) is outside calibrated hardware limits "
                f"[{settings.min_sensor_distance_cm}, {settings.max_sensor_distance_cm}] cm."
            ),
            details={
                "distance_cm": raw_distance,
                "min_allowed_cm": settings.min_sensor_distance_cm,
                "max_allowed_cm": settings.max_sensor_distance_cm,
            },
        )

    # Calculate depth from mount height, raw distance, and calibration offset
    derived_depth = round(max(0.0, mount_height_cm - raw_distance + offset_cm), 4)
    speed_of_sound = compute_speed_of_sound(payload.temperature_c)

    quality_flag = "GOOD"
    quality_score = 1.0
    discrepancy: Optional[float] = None

    if raw_distance > mount_height_cm + 2.0:
        raise InvalidPayloadError(
            message=(
                f"Measured distance ({raw_distance} cm) exceeds probe mount height "
                f"({mount_height_cm} cm) beyond tolerance."
            ),
            details={"distance_cm": raw_distance, "mount_height_cm": mount_height_cm},
        )
    elif raw_distance > mount_height_cm:
        # Minor bed bounce within 2cm tolerance: clamp depth to 0 and flag
        derived_depth = 0.0
        quality_flag = "CLAMPED_ZERO"
        quality_score = 0.85

    if payload.water_depth_cm is not None:
        discrepancy = round(abs(payload.water_depth_cm - derived_depth), 4)
        # If payload water_depth_cm contradicts mount_height - distance_cm by > 5cm, reject as invalid
        if discrepancy > 5.0:
            raise InvalidPayloadError(
                message=(
                    f"Provided water_depth_cm ({payload.water_depth_cm} cm) is inconsistent with "
                    f"calibrated depth ({derived_depth} cm) for mount_height_cm={mount_height_cm} cm."
                ),
                details={
                    "provided_water_depth_cm": payload.water_depth_cm,
                    "calculated_water_depth_cm": derived_depth,
                    "discrepancy_cm": discrepancy,
                },
            )
        elif discrepancy > 0.5:
            quality_flag = "CALIBRATION_DRIFT"
            quality_score = 0.75

    metadata = CalibrationMetadata(
        mount_height_cm=mount_height_cm,
        calibration_offset_cm=offset_cm,
        speed_of_sound_m_s=speed_of_sound,
        temperature_compensated=payload.temperature_c is not None,
        depth_discrepancy_cm=discrepancy,
    )

    return raw_distance, derived_depth, quality_flag, quality_score, metadata
