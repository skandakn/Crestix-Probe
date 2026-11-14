"""Initial Crestix Probe database schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-11-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "terrain_models",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=512), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("content_type", sa.String(length=128), nullable=False),
        sa.Column("crs", sa.String(length=64), nullable=False),
        sa.Column("resolution_cm", sa.Float(), nullable=False),
        sa.Column("bounds_json", sa.JSON(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "rainfall_scenarios",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("intensity_mm_hr", sa.Float(), nullable=False),
        sa.Column("duration_minutes", sa.Float(), nullable=False),
        sa.Column("return_period_years", sa.Integer(), nullable=True),
        sa.Column("spatial_distribution", sa.String(length=64), nullable=False),
        sa.Column("hyetograph_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "experiments",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("terrain_id", sa.String(length=64), nullable=True),
        sa.Column("rainfall_scenario_id", sa.String(length=64), nullable=True),
        sa.Column("owner_id", sa.String(length=36), nullable=True),
        sa.Column("probe_positions_json", sa.JSON(), nullable=True),
        sa.Column("calibration_config_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["rainfall_scenario_id"], ["rainfall_scenarios.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["terrain_id"], ["terrain_models.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "sensor_readings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("experiment_id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.String(length=32), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("raw_distance_cm", sa.Float(), nullable=False),
        sa.Column("calculated_water_depth_cm", sa.Float(), nullable=False),
        sa.Column("temperature_c", sa.Float(), nullable=True),
        sa.Column("mount_height_cm", sa.Float(), nullable=False),
        sa.Column("calibration_offset_cm", sa.Float(), nullable=False),
        sa.Column("speed_of_sound_m_s", sa.Float(), nullable=True),
        sa.Column("quality_flag", sa.String(length=32), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=False),
        sa.Column("calibration_metadata_json", sa.JSON(), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["experiment_id"], ["experiments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "experiment_id",
            "position",
            "timestamp",
            name="uq_sensor_reading_exp_pos_ts",
        ),
    )
    op.create_index(
        op.f("ix_sensor_readings_experiment_id"),
        "sensor_readings",
        ["experiment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_sensor_readings_position"),
        "sensor_readings",
        ["position"],
        unique=False,
    )
    op.create_index(
        op.f("ix_sensor_readings_timestamp"),
        "sensor_readings",
        ["timestamp"],
        unique=False,
    )

    op.create_table(
        "simulation_jobs",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("experiment_id", sa.String(length=64), nullable=False),
        sa.Column("terrain_id", sa.String(length=64), nullable=True),
        sa.Column("rainfall_scenario_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("adapter_mode", sa.String(length=32), nullable=False),
        sa.Column("is_operational_solver", sa.Boolean(), nullable=False),
        sa.Column("parameters_json", sa.JSON(), nullable=False),
        sa.Column("frames_json", sa.JSON(), nullable=False),
        sa.Column("summary_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["experiment_id"], ["experiments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_simulation_jobs_experiment_id"),
        "simulation_jobs",
        ["experiment_id"],
        unique=False,
    )

    op.create_table(
        "forecast_jobs",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("experiment_id", sa.String(length=64), nullable=False),
        sa.Column("horizon_seconds", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("adapter_mode", sa.String(length=32), nullable=False),
        sa.Column("is_operational_model", sa.Boolean(), nullable=False),
        sa.Column("input_window_json", sa.JSON(), nullable=False),
        sa.Column("predictions_json", sa.JSON(), nullable=False),
        sa.Column("metrics_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["experiment_id"], ["experiments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_forecast_jobs_experiment_id"),
        "forecast_jobs",
        ["experiment_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_forecast_jobs_experiment_id"), table_name="forecast_jobs")
    op.drop_table("forecast_jobs")
    op.drop_index(op.f("ix_simulation_jobs_experiment_id"), table_name="simulation_jobs")
    op.drop_table("simulation_jobs")
    op.drop_index(op.f("ix_sensor_readings_timestamp"), table_name="sensor_readings")
    op.drop_index(op.f("ix_sensor_readings_position"), table_name="sensor_readings")
    op.drop_index(op.f("ix_sensor_readings_experiment_id"), table_name="sensor_readings")
    op.drop_table("sensor_readings")
    op.drop_table("experiments")
    op.drop_table("rainfall_scenarios")
    op.drop_table("terrain_models")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
