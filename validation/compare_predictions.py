#!/usr/bin/env python3
"""Compare prediction and sensor CSVs at matching stations/times; never synthesizes readings."""
import argparse
import csv
import math
from datetime import datetime


def read_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    required = {"timestamp", "location_id", "water_depth_cm"}
    if not rows or not required.issubset(rows[0]):
        raise ValueError(f"{path}: CSV must contain {', '.join(sorted(required))} and at least one row")
    for row in rows:
        row["_time"] = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
        row["_depth"] = float(row["water_depth_cm"])
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("predictions")
    parser.add_argument("observations")
    parser.add_argument("--tolerance-seconds", type=float, default=5)
    parser.add_argument("--output", default="matched_validation.csv")
    args = parser.parse_args()
    predictions, observations = read_rows(args.predictions), read_rows(args.observations)
    used, matched = set(), []
    for prediction in predictions:
        candidates = [(abs((obs["_time"] - prediction["_time"]).total_seconds()), i, obs)
                      for i, obs in enumerate(observations)
                      if i not in used and obs["location_id"] == prediction["location_id"]]
        if not candidates:
            continue
        delta, index, observation = min(candidates, key=lambda item: item[0])
        if delta <= args.tolerance_seconds:
            used.add(index)
            matched.append((prediction, observation, delta))
    fields = ["timestamp", "location_id", "prediction_depth_cm", "observed_depth_cm", "time_delta_seconds", "error_cm"]
    with open(args.output, "w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for pred, obs, delta in matched:
            writer.writerow({"timestamp": obs["timestamp"], "location_id": obs["location_id"],
                             "prediction_depth_cm": pred["_depth"], "observed_depth_cm": obs["_depth"],
                             "time_delta_seconds": delta, "error_cm": pred["_depth"] - obs["_depth"]})
    print(f"Matched pairs: {len(matched)}; prediction rows: {len(predictions)}; observation rows: {len(observations)}")
    if matched:
        errors = [pred["_depth"] - obs["_depth"] for pred, obs, _ in matched]
        print(f"MAE (cm): {sum(abs(e) for e in errors) / len(errors):.4f}")
        print(f"RMSE (cm): {math.sqrt(sum(e * e for e in errors) / len(errors)):.4f}")
        if all("flooded" in p and "flooded" in o for p, o, _ in matched):
            hits = sum(p["flooded"].strip().lower() in {"1", "true", "yes"} and o["flooded"].strip().lower() in {"1", "true", "yes"} for p, o, _ in matched)
            misses = sum(p["flooded"].strip().lower() in {"0", "false", "no"} and o["flooded"].strip().lower() in {"1", "true", "yes"} for p, o, _ in matched)
            false_alarms = sum(p["flooded"].strip().lower() in {"1", "true", "yes"} and o["flooded"].strip().lower() in {"0", "false", "no"} for p, o, _ in matched)
            denominator = hits + misses + false_alarms
            print(f"CSI: {hits / denominator:.4f}" if denominator else "CSI: undefined (no classified events)")
    else:
        print("MAE/RMSE: undefined (no station-and-time matches)")
    print(f"Matched rows written to {args.output}")


if __name__ == "__main__":
    main()
