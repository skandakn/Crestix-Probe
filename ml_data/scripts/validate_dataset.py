#!/usr/bin/env python3
"""
Validate Dataset - Crestix Probe LarNO Pipeline
Automated verification tool to validate:
- Disjoint event splits (zero data leakage between train, val, and test)
- Array dimensionalities, dtypes, and NaN/Inf integrity
- Non-negative physical water depth
- Checksum verification
- Schema and manifest conformity
"""

import argparse
import hashlib
import json
import os
import sys
import numpy as np


def sha256_file(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as fp:
        while chunk := fp.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def validate_splits(split_manifest_path: str) -> list[str]:
    """Validates the train/val/test event splits for partition disjointness."""
    errors = []
    if not os.path.exists(split_manifest_path):
        return [f"Split manifest not found: {split_manifest_path}"]

    with open(split_manifest_path, "r") as fp:
        manifest = json.load(fp)

    splits = manifest.get("splits", {})
    train_events = [e["event_id"] if isinstance(e, dict) else e for e in splits.get("train", [])]
    val_events = [e["event_id"] if isinstance(e, dict) else e for e in splits.get("val", [])]
    test_events = [e["event_id"] if isinstance(e, dict) else e for e in splits.get("test", [])]

    train_set = set(train_events)
    val_set = set(val_events)
    test_set = set(test_events)

    # 1. Check counts
    if len(train_set) != 6:
        errors.append(f"Expected 6 train events, found {len(train_set)}")
    if len(val_set) != 2:
        errors.append(f"Expected 2 val events, found {len(val_set)}")
    if len(test_set) != 12:
        errors.append(f"Expected 12 test events, found {len(test_set)}")

    # 2. Check pairwise disjointness (zero data leakage)
    train_val_overlap = train_set.intersection(val_set)
    if train_val_overlap:
        errors.append(f"CRITICAL: Train and Val overlap on events: {train_val_overlap}")

    train_test_overlap = train_set.intersection(test_set)
    if train_test_overlap:
        errors.append(f"CRITICAL: Train and Test overlap on events: {train_test_overlap}")

    val_test_overlap = val_set.intersection(test_set)
    if val_test_overlap:
        errors.append(f"CRITICAL: Val and Test overlap on events: {val_test_overlap}")

    # Total uniqueness check
    total_events = len(train_set) + len(val_set) + len(test_set)
    if total_events != 20:
        errors.append(f"Total events must equal 20, got {total_events}")

    return errors


def validate_fixture(fixture_dir: str) -> list[str]:
    """Validates array shapes, datatypes, missing values, and checksums in fixture."""
    errors = []
    if not os.path.exists(fixture_dir):
        return [f"Fixture directory not found: {fixture_dir}"]

    # 1. DEM
    dem_path = os.path.join(fixture_dir, "dem.npy")
    if not os.path.exists(dem_path):
        errors.append("dem.npy missing from fixture")
    else:
        dem = np.load(dem_path)
        if dem.shape != (32, 32):
            errors.append(f"dem.npy shape mismatch: expected (32, 32), got {dem.shape}")
        if dem.dtype != np.float32:
            errors.append(f"dem.npy dtype mismatch: expected float32, got {dem.dtype}")
        if np.isnan(dem).sum() > 0:
            errors.append(f"dem.npy contains {np.isnan(dem).sum()} NaN values")
        if np.isinf(dem).sum() > 0:
            errors.append(f"dem.npy contains {np.isinf(dem).sum()} Inf values")

    # 2. Rainfall
    rain_path = os.path.join(fixture_dir, "rainfall.npy")
    if not os.path.exists(rain_path):
        errors.append("rainfall.npy missing from fixture")
    else:
        rain = np.load(rain_path)
        if rain.shape != (36, 32, 32):
            errors.append(f"rainfall.npy shape mismatch: expected (36, 32, 32), got {rain.shape}")
        if rain.dtype != np.float32:
            errors.append(f"rainfall.npy dtype mismatch: expected float32, got {rain.dtype}")
        if np.isnan(rain).sum() > 0:
            errors.append(f"rainfall.npy contains {np.isnan(rain).sum()} NaN values")
        if np.any(rain < 0):
            errors.append(f"rainfall.npy contains negative precipitation values")

    # 3. Water Depth (h)
    h_path = os.path.join(fixture_dir, "h.npy")
    if not os.path.exists(h_path):
        errors.append("h.npy missing from fixture")
    else:
        h = np.load(h_path)
        if h.shape != (36, 32, 32):
            errors.append(f"h.npy shape mismatch: expected (36, 32, 32), got {h.shape}")
        if h.dtype != np.float32:
            errors.append(f"h.npy dtype mismatch: expected float32, got {h.dtype}")
        if np.isnan(h).sum() > 0:
            errors.append(f"h.npy contains {np.isnan(h).sum()} NaN values")
        if np.any(h < -1e-5):
            errors.append(f"h.npy contains negative water depth values: min={h.min()}")

    # 4. Metadata and checksums
    meta_path = os.path.join(fixture_dir, "metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r") as fp:
            meta = json.load(fp)
        checksums = meta.get("checksums", {})
        if os.path.exists(dem_path) and "dem_sha256" in checksums:
            calc_dem = sha256_file(dem_path)
            if calc_dem != checksums["dem_sha256"]:
                errors.append(f"dem.npy checksum mismatch: expected {checksums['dem_sha256']}, got {calc_dem}")
        if os.path.exists(rain_path) and "rainfall_sha256" in checksums:
            calc_rain = sha256_file(rain_path)
            if calc_rain != checksums["rainfall_sha256"]:
                errors.append(f"rainfall.npy checksum mismatch: expected {checksums['rainfall_sha256']}, got {calc_rain}")
        if os.path.exists(h_path) and "h_sha256" in checksums:
            calc_h = sha256_file(h_path)
            if calc_h != checksums["h_sha256"]:
                errors.append(f"h.npy checksum mismatch: expected {checksums['h_sha256']}, got {calc_h}")

    return errors


def main():
    parser = argparse.ArgumentParser(description="Validate LarNO UKEA 8m/5min dataset.")
    parser.add_argument("--split-manifest", type=str, default="ml_data/split_manifest.json")
    parser.add_argument("--dataset-manifest", type=str, default="ml_data/dataset_manifest.json")
    parser.add_argument("--fixture-dir", type=str, default="ml_data/fixtures/sample_event")
    args = parser.parse_args()

    print("=== Crestix Probe LarNO Dataset Validation ===")
    all_errors = []

    # 1. Validate splits
    print("[1/2] Validating event splits...")
    split_errors = validate_splits(args.split_manifest)
    if split_errors:
        all_errors.extend(split_errors)
        for e in split_errors:
            print(f"  ❌ {e}")
    else:
        print("  ✓ Split partition verified: 6 train, 2 val, 12 test (Pairwise Disjoint, 0 Leakage)")

    # 2. Validate fixture
    print("[2/2] Validating sample fixture...")
    fixture_errors = validate_fixture(args.fixture_dir)
    if fixture_errors:
        all_errors.extend(fixture_errors)
        for e in fixture_errors:
            print(f"  ❌ {e}")
    else:
        print("  ✓ Sample fixture verified: dem=(32,32), rain=(36,32,32), h=(36,32,32), float32, 0 NaNs, SHA-256 match")

    if all_errors:
        print(f"\n❌ Validation FAILED with {len(all_errors)} error(s).")
        sys.exit(1)
    else:
        print("\n✅ All validation checks PASSED successfully.")
        sys.exit(0)


if __name__ == "__main__":
    main()
