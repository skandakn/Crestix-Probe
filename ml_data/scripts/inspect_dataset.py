#!/usr/bin/env python3
"""
Inspect Dataset - Crestix Probe LarNO Pipeline
Inspects raw and preprocessed LarNO UKEA 8m/5min dataset files, verifying shapes,
dtypes, physical statistics, missing values, and crop bounds.
"""

import argparse
import io
import json
import os
import sys
import numpy as np

# Default URL root for LarNO benchmark on Hugging Face
HF_DATASET_ROOT = "https://huggingface.co/datasets/holmescao/LarNO-dataset/resolve/main"

DEFAULT_CROP = {
    "row_start": 12,
    "row_end": 44,
    "col_start": 32,
    "col_end": 64,
}


def inspect_array(name: str, arr: np.ndarray, expected_shape=None) -> dict:
    """Inspects a numpy array and extracts comprehensive summary statistics."""
    nan_count = int(np.isnan(arr).sum())
    inf_count = int(np.isinf(arr).sum())
    has_negative = bool(np.any(arr < 0)) if not np.isnan(arr).all() else False

    stats = {
        "name": name,
        "shape": list(arr.shape),
        "ndim": int(arr.ndim),
        "dtype": str(arr.dtype),
        "nan_count": nan_count,
        "inf_count": inf_count,
        "min": float(np.nanmin(arr)) if arr.size > 0 else None,
        "max": float(np.nanmax(arr)) if arr.size > 0 else None,
        "mean": float(np.nanmean(arr)) if arr.size > 0 else None,
        "std": float(np.nanstd(arr)) if arr.size > 0 else None,
        "has_negative": has_negative,
        "shape_matches_expected": list(arr.shape) == list(expected_shape) if expected_shape else True
    }
    return stats


def print_stats_table(stats_list: list):
    """Prints a formatted ASCII report table for inspected arrays."""
    header = f"{'Variable':<18} | {'Shape':<16} | {'Dtype':<8} | {'Min':<8} | {'Max':<8} | {'Mean':<8} | {'NaN/Inf':<8}"
    sep = "-" * len(header)
    print(sep)
    print(header)
    print(sep)
    for s in stats_list:
        shape_str = str(tuple(s['shape']))
        min_str = f"{s['min']:.3f}" if s['min'] is not None else "N/A"
        max_str = f"{s['max']:.3f}" if s['max'] is not None else "N/A"
        mean_str = f"{s['mean']:.3f}" if s['mean'] is not None else "N/A"
        nan_inf_str = f"{s['nan_count']}/{s['inf_count']}"
        print(f"{s['name']:<18} | {shape_str:<16} | {s['dtype']:<8} | {min_str:<8} | {max_str:<8} | {mean_str:<8} | {nan_inf_str:<8}")
    print(sep)


def inspect_local_dir(data_dir: str, crop_rows=(12, 44), crop_cols=(32, 64)):
    """Inspects a local processed or fixture directory."""
    print(f"\n[Inspect] Scanning directory: {data_dir}")
    stats_list = []

    dem_path = os.path.join(data_dir, "dem.npy")
    if os.path.exists(dem_path):
        dem = np.load(dem_path)
        stats_list.append(inspect_array("DEM", dem))

    rain_path = os.path.join(data_dir, "rainfall.npy")
    if os.path.exists(rain_path):
        rain = np.load(rain_path)
        stats_list.append(inspect_array("Rainfall", rain))

    h_path = os.path.join(data_dir, "h.npy")
    if os.path.exists(h_path):
        h = np.load(h_path)
        stats_list.append(inspect_array("Water Depth (h)", h))

    print_stats_table(stats_list)

    # Check for metadata
    meta_path = os.path.join(data_dir, "metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r") as fp:
            meta = json.load(fp)
        print(f"[Metadata] Event: {meta.get('event_id')} | Split: {meta.get('split')}")
        print(f"[Metadata] Crop: Rows {meta.get('crop_bounds', {}).get('row_start')}:{meta.get('crop_bounds', {}).get('row_end')}, Cols {meta.get('crop_bounds', {}).get('col_start')}:{meta.get('crop_bounds', {}).get('col_end')}")

    return stats_list


def main():
    parser = argparse.ArgumentParser(description="Inspect LarNO UKEA 8m/5min dataset.")
    parser.add_argument("--dir", type=str, default="ml_data/fixtures/sample_event", help="Local directory to inspect.")
    parser.add_argument("--crop-r1", type=int, default=12, help="Crop start row index.")
    parser.add_argument("--crop-r2", type=int, default=44, help="Crop end row index.")
    parser.add_argument("--crop-c1", type=int, default=32, help="Crop start col index.")
    parser.add_argument("--crop-c2", type=int, default=64, help="Crop end col index.")
    args = parser.parse_args()

    if not os.path.exists(args.dir):
        print(f"Directory not found: {args.dir}")
        sys.exit(1)

    inspect_local_dir(args.dir, (args.crop_r1, args.crop_r2), (args.crop_c1, args.crop_c2))


if __name__ == "__main__":
    main()
