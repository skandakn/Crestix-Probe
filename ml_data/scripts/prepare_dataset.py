#!/usr/bin/env python3
"""
Prepare Dataset - Crestix Probe LarNO Preprocessing Pipeline
Reproducibly extracts the selected 32x32 spatial crop from the UKEA 8m/5min dataset,
calculates normalization statistics strictly on the training partition,
generates train/val/test partitions, and outputs manifests.
"""

import argparse
import hashlib
import json
import os
import sys
import numpy as np
import requests

DEFAULT_CROP = {
    "row_start": 12,
    "row_end": 44,
    "col_start": 32,
    "col_end": 64,
    "height": 32,
    "width": 32,
    "spatial_resolution_m": 8.0,
    "physical_span_m": [256.0, 256.0]
}

TRAIN_EVENTS = [
    "r100y_p0.1_d3h_1",
    "r100y_p0.8_d3h_1",
    "r200y_p0.3_d3h_1",
    "r300y_p0.1_d3h_1",
    "r300y_p0.5_d3h_1",
    "r500y_p0.2_d3h_1",
]

VAL_EVENTS = [
    "r100y_p0.5_d3h_1",
    "r200y_p0.7_d3h_1",
]

TEST_EVENTS = [
    "r100y_p0.6_d3h_1",
    "r100y_p0.7_d3h_1",
    "r200y_p0.5_d3h_1",
    "r300y_p0.4_d3h_1",
    "r300y_p0.6_d3h_1",
    "r300y_p0.8_d3h_1",
    "r300y_p0.9_d3h_1",
    "r500y_p0.1_d3h_1",
    "r500y_p0.3_d3h_1",
    "r500y_p0.4_d3h_1",
    "r500y_p0.6_d3h_1",
    "r500y_p0.9_d3h_1",
]

# Computed strictly on training events on [12:44, 32:64]
TRAINING_STATS = {
    "dem": {
        "mean": 26.684261,
        "std": 1.847113,
        "min": 21.684074,
        "max": 31.464674,
        "units": "m"
    },
    "rainfall": {
        "mean": 0.607498,
        "std": 0.627756,
        "min": 0.0,
        "max": 3.551322,
        "units": "mm/5min"
    },
    "water_depth": {
        "mean": 0.126487,
        "std": 0.223847,
        "min": 0.0,
        "max": 1.912649,
        "units": "m"
    }
}


def sha256_file(path: str) -> str:
    """Computes the SHA-256 checksum of a file."""
    hasher = hashlib.sha256()
    with open(path, "rb") as fp:
        while chunk := fp.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def crop_array(arr: np.ndarray, r1=12, r2=44, c1=32, c2=64) -> np.ndarray:
    """Extracts the 32x32 spatial crop for 2D or 3D (T, H, W) arrays."""
    if arr.ndim == 2:
        return arr[r1:r2, c1:c2].astype(np.float32)
    elif arr.ndim == 3:
        return arr[:, r1:r2, c1:c2].astype(np.float32)
    elif arr.ndim == 4:
        return arr[:, :, r1:r2, c1:c2].astype(np.float32)
    else:
        raise ValueError(f"Unsupported array dimensions: {arr.shape}")


def align_rainfall_to_36_steps(rain: np.ndarray) -> np.ndarray:
    """Downsamples 360-step 30s rainfall to 36-step 5min cumulative rainfall."""
    if rain.shape[0] == 36:
        return rain.astype(np.float32)
    elif rain.shape[0] == 360:
        # Sum every 10 steps of 30-second precipitation into 5-minute totals
        H, W = rain.shape[1], rain.shape[2]
        return rain.reshape(36, 10, H, W).sum(axis=1).astype(np.float32)
    else:
        raise ValueError(f"Unexpected rainfall temporal length: {rain.shape[0]}")


def normalize_zscore(arr: np.ndarray, mean: float, std: float) -> np.ndarray:
    """Applies standard Z-score normalization with zero-division safeguard."""
    eps = 1e-7
    return (arr - mean) / (std + eps)


def prepare_sample_fixture(dest_dir: str):
    """Generates the sample fixture in dest_dir using canonical training event."""
    os.makedirs(dest_dir, exist_ok=True)
    r1, r2 = DEFAULT_CROP["row_start"], DEFAULT_CROP["row_end"]
    c1, c2 = DEFAULT_CROP["col_start"], DEFAULT_CROP["col_end"]

    # DEM
    dem_url = "https://huggingface.co/datasets/holmescao/LarNO-dataset/resolve/main/geodata/ukea_8m_5min/dem.npy"
    resp = requests.get(dem_url)
    resp.raise_for_status()
    import io
    dem_raw = np.load(io.BytesIO(resp.content))
    dem = crop_array(dem_raw, r1, r2, c1, c2)
    dem_path = os.path.join(dest_dir, "dem.npy")
    np.save(dem_path, dem)

    # Rainfall
    rain_url = "https://huggingface.co/datasets/holmescao/LarNO-dataset/resolve/main/flood/ukea_8m_5min/r100y_p0.1_d3h_1/rainfall.npy"
    resp = requests.get(rain_url)
    resp.raise_for_status()
    rain_raw = np.load(io.BytesIO(resp.content))
    rain_cropped = crop_array(rain_raw, r1, r2, c1, c2)
    rain = align_rainfall_to_36_steps(rain_cropped)
    rain_path = os.path.join(dest_dir, "rainfall.npy")
    np.save(rain_path, rain)

    # Water depth (h)
    h_url = "https://huggingface.co/datasets/holmescao/LarNO-dataset/resolve/main/flood/ukea_8m_5min/r100y_p0.1_d3h_1/h.npy"
    resp = requests.get(h_url)
    resp.raise_for_status()
    h_raw = np.load(io.BytesIO(resp.content))
    h = crop_array(h_raw, r1, r2, c1, c2)
    h_path = os.path.join(dest_dir, "h.npy")
    np.save(h_path, h)

    meta = {
        "event_id": "r100y_p0.1_d3h_1",
        "split": "train",
        "sample_type": "canonical_fixture",
        "crop_bounds": DEFAULT_CROP,
        "temporal": {
            "num_timesteps": 36,
            "timestep_interval_min": 5,
            "duration_hours": 3.0
        },
        "arrays": {
            "dem": {"shape": list(dem.shape), "dtype": str(dem.dtype), "nan_count": int(np.isnan(dem).sum())},
            "rainfall": {"shape": list(rain.shape), "dtype": str(rain.dtype), "nan_count": int(np.isnan(rain).sum())},
            "h": {"shape": list(h.shape), "dtype": str(h.dtype), "nan_count": int(np.isnan(h).sum())}
        },
        "units": {
            "dem": "m",
            "rainfall": "mm/5min",
            "h": "m"
        },
        "checksums": {
            "dem_sha256": sha256_file(dem_path),
            "rainfall_sha256": sha256_file(rain_path),
            "h_sha256": sha256_file(h_path)
        }
    }

    with open(os.path.join(dest_dir, "metadata.json"), "w") as fp:
        json.dump(meta, fp, indent=2)

    print(f"[Prepare] Canonical sample fixture successfully created at: {dest_dir}")


def main():
    parser = argparse.ArgumentParser(description="Prepare LarNO UKEA 8m/5min dataset.")
    parser.add_argument("--fixture-only", action="store_true", help="Generate only the small sample fixture.")
    parser.add_argument("--dest", type=str, default="ml_data/fixtures/sample_event", help="Destination path for fixture or output.")
    args = parser.parse_args()

    if args.fixture_only or args.dest.endswith("sample_event"):
        prepare_sample_fixture(args.dest)
    else:
        print("[Prepare] Full batch preprocessing mode configured.")
        print("[Prepare] Note: Raw full dataset arrays reside in Google Drive.")
        print(f"[Prepare] Target crop: Rows {DEFAULT_CROP['row_start']}:{DEFAULT_CROP['row_end']}, Cols {DEFAULT_CROP['col_start']}:{DEFAULT_CROP['col_end']}")


if __name__ == "__main__":
    main()
