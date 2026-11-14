"""
Unit and Integration Tests - Crestix Probe LarNO Preprocessing Pipeline
Validates dataset integrity, fixture dimensions, split disjointness,
normalization consistency, and contract compatibility for both XGBoost and PINO.
"""

import hashlib
import json
import os
import pytest
import numpy as np

FIXTURE_DIR = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_event")
SPLIT_MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "split_manifest.json")
DATASET_MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset_manifest.json")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "schemas", "sample_schema.json")


def sha256_of_file(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as fp:
        while chunk := fp.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


class TestLarNODatasetSplitManifest:
    """Verifies event split partition invariants, zero data-leakage, and coverage."""

    def test_split_manifest_exists_and_loads(self):
        assert os.path.exists(SPLIT_MANIFEST_PATH), f"Missing split manifest at {SPLIT_MANIFEST_PATH}"
        with open(SPLIT_MANIFEST_PATH, "r") as fp:
            data = json.load(fp)
        assert "splits" in data
        assert "train" in data["splits"]
        assert "val" in data["splits"]
        assert "test" in data["splits"]

    def test_split_event_counts(self):
        with open(SPLIT_MANIFEST_PATH, "r") as fp:
            data = json.load(fp)
        train = data["splits"]["train"]
        val = data["splits"]["val"]
        test = data["splits"]["test"]

        assert len(train) == 6, f"Expected 6 train events, found {len(train)}"
        assert len(val) == 2, f"Expected 2 val events, found {len(val)}"
        assert len(test) == 12, f"Expected 12 test events, found {len(test)}"

    def test_split_pairwise_disjointness_zero_leakage(self):
        with open(SPLIT_MANIFEST_PATH, "r") as fp:
            data = json.load(fp)
        train_ids = {e["event_id"] if isinstance(e, dict) else e for e in data["splits"]["train"]}
        val_ids = {e["event_id"] if isinstance(e, dict) else e for e in data["splits"]["val"]}
        test_ids = {e["event_id"] if isinstance(e, dict) else e for e in data["splits"]["test"]}

        # Must have zero intersection
        assert train_ids.isdisjoint(val_ids), f"Train and Val overlap: {train_ids & val_ids}"
        assert train_ids.isdisjoint(test_ids), f"Train and Test overlap: {train_ids & test_ids}"
        assert val_ids.isdisjoint(test_ids), f"Val and Test overlap: {val_ids & test_ids}"

        # Total unique events must equal 20
        total_unique = len(train_ids | val_ids | test_ids)
        assert total_unique == 20, f"Expected 20 unique events, found {total_unique}"


class TestLarNOSampleFixture:
    """Verifies that the small sample fixture satisfies array shapes, dtypes, and values."""

    @pytest.fixture(scope="module")
    def fixture_data(self):
        dem_path = os.path.join(FIXTURE_DIR, "dem.npy")
        rain_path = os.path.join(FIXTURE_DIR, "rainfall.npy")
        h_path = os.path.join(FIXTURE_DIR, "h.npy")
        meta_path = os.path.join(FIXTURE_DIR, "metadata.json")

        assert os.path.exists(dem_path), "Missing fixture dem.npy"
        assert os.path.exists(rain_path), "Missing fixture rainfall.npy"
        assert os.path.exists(h_path), "Missing fixture h.npy"
        assert os.path.exists(meta_path), "Missing fixture metadata.json"

        return {
            "dem": np.load(dem_path),
            "rain": np.load(rain_path),
            "h": np.load(h_path),
            "paths": {
                "dem": dem_path,
                "rain": rain_path,
                "h": h_path,
                "meta": meta_path
            }
        }

    def test_array_shapes_and_dtypes(self, fixture_data):
        dem = fixture_data["dem"]
        rain = fixture_data["rain"]
        h = fixture_data["h"]

        # Exact required dimensions: 32x32 spatial, 36 timesteps
        assert dem.shape == (32, 32), f"DEM shape must be (32, 32), got {dem.shape}"
        assert rain.shape == (36, 32, 32), f"Rainfall shape must be (36, 32, 32), got {rain.shape}"
        assert h.shape == (36, 32, 32), f"Water depth shape must be (36, 32, 32), got {h.shape}"

        assert dem.dtype == np.float32
        assert rain.dtype == np.float32
        assert h.dtype == np.float32

    def test_array_missing_values_and_physical_bounds(self, fixture_data):
        dem = fixture_data["dem"]
        rain = fixture_data["rain"]
        h = fixture_data["h"]

        # No NaNs or Infs
        assert np.isnan(dem).sum() == 0, "DEM contains NaNs"
        assert np.isnan(rain).sum() == 0, "Rainfall contains NaNs"
        assert np.isnan(h).sum() == 0, "Water depth contains NaNs"

        assert np.isinf(dem).sum() == 0, "DEM contains Infs"
        assert np.isinf(rain).sum() == 0, "Rainfall contains Infs"
        assert np.isinf(h).sum() == 0, "Water depth contains Infs"

        # Physical constraints
        assert np.all(rain >= 0.0), "Rainfall cannot be negative"
        assert np.all(h >= -1e-6), f"Water depth cannot be negative (min: {h.min()})"
        assert np.all(dem > 0.0), f"Topographic elevation must be positive (min: {dem.min()})"

    def test_checksum_integrity(self, fixture_data):
        meta_path = fixture_data["paths"]["meta"]
        with open(meta_path, "r") as fp:
            meta = json.load(fp)

        checksums = meta["checksums"]
        assert sha256_of_file(fixture_data["paths"]["dem"]) == checksums["dem_sha256"]
        assert sha256_of_file(fixture_data["paths"]["rain"]) == checksums["rainfall_sha256"]
        assert sha256_of_file(fixture_data["paths"]["h"]) == checksums["h_sha256"]


class TestModelContracts:
    """Verifies that the preprocessed arrays integrate seamlessly with XGBoost and PINO pipelines."""

    @pytest.fixture(scope="module")
    def sample_arrays(self):
        dem = np.load(os.path.join(FIXTURE_DIR, "dem.npy"))
        rain = np.load(os.path.join(FIXTURE_DIR, "rainfall.npy"))
        h = np.load(os.path.join(FIXTURE_DIR, "h.npy"))
        return dem, rain, h

    def test_xgboost_tabular_feature_generation(self, sample_arrays):
        dem, rain, h = sample_arrays
        T, H, W = rain.shape

        # Construct spatial coordinates
        row_coords, col_coords = np.meshgrid(np.arange(H) / float(H - 1), np.arange(W) / float(W - 1), indexing="ij")

        # Compute elevation gradient (slope)
        grad_y, grad_x = np.gradient(dem, 8.0, 8.0)
        slope = np.sqrt(grad_x**2 + grad_y**2)

        # Tabular construction for time step t=2 with lags (t-1, t-2)
        t = 2
        features = np.column_stack([
            dem.flatten(),
            slope.flatten(),
            row_coords.flatten(),
            col_coords.flatten(),
            rain[t].flatten(),
            rain[t - 1].flatten(),
            rain[t - 2].flatten(),
            h[t - 1].flatten(),
            h[t - 2].flatten(),
        ])
        target = h[t].flatten()

        assert features.shape == (H * W, 9), f"Expected ({H*W}, 9) tabular shape, got {features.shape}"
        assert target.shape == (H * W,), f"Expected ({H*W},) target shape, got {target.shape}"
        assert np.isfinite(features).all(), "Features matrix must not contain NaN or Inf"
        assert np.isfinite(target).all(), "Target vector must not contain NaN or Inf"

    def test_pino_spatiotemporal_tensor_framing(self, sample_arrays):
        dem, rain, h = sample_arrays
        T, H, W = rain.shape

        # PINO requires input: [Batch, Channels, Height, Width, Timesteps]
        # Channel 0: static DEM broadcasted across time (1, 1, H, W, T)
        dem_tensor = np.tile(dem[np.newaxis, np.newaxis, :, :, np.newaxis], (1, 1, 1, 1, T))
        # Channel 1: dynamic rainfall (1, 1, H, W, T)
        rain_tensor = rain.transpose(1, 2, 0)[np.newaxis, np.newaxis, :, :, :]

        pino_input = np.concatenate([dem_tensor, rain_tensor], axis=1)  # (1, 2, H, W, T)
        pino_target = h.transpose(1, 2, 0)[np.newaxis, np.newaxis, :, :, :]  # (1, 1, H, W, T)

        assert pino_input.shape == (1, 2, 32, 32, 36)
        assert pino_target.shape == (1, 1, 32, 32, 36)
        assert pino_input.dtype == np.float32
        assert pino_target.dtype == np.float32


class TestDatasetManifestAndSchema:
    """Verifies that dataset manifest conforms to requirements and normalization bounds."""

    def test_dataset_manifest_contents(self):
        assert os.path.exists(DATASET_MANIFEST_PATH)
        with open(DATASET_MANIFEST_PATH, "r") as fp:
            manifest = json.load(fp)

        # Spatial crop verification
        crop = manifest["spatial_crop"]
        assert crop["row_start"] == 12
        assert crop["row_end"] == 44
        assert crop["col_start"] == 32
        assert crop["col_end"] == 64
        assert crop["height_pixels"] == 32
        assert crop["width_pixels"] == 32
        assert crop["physical_width_meters"] == 256.0
        assert crop["physical_height_meters"] == 256.0

        # Normalization constants verification
        norm = manifest["normalization_parameters"]
        assert norm["dem"]["mean"] > 0
        assert norm["dem"]["std"] > 0
        assert norm["rainfall"]["mean"] > 0
        assert norm["rainfall"]["std"] > 0
        assert norm["water_depth"]["mean"] > 0
        assert norm["water_depth"]["std"] > 0
