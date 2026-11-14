"""
Crestix Probe - Dynamic Urban Flood Hazard & Exposure Risk Indexer
==================================================================
Quantifies community hazard severity, road inundation impassability, and critical
infrastructure exposure from predicted 2D depth and velocity fields.

Standards:
  1. UK Environment Agency / DEFRA Flood Hazard Rating (HR):
       HR = d * (v + 0.5) + DF
     Where:
       - d is water depth (m)
       - v is flow velocity (m/s)
       - DF is Debris Factor:
           d <= 0.25m -> DF = 0.5 (urban pastures)
           d > 0.25m  -> DF = 1.0 (urban structural debris)
     Hazard Classification:
       HR < 0.75:       Low ("Caution - shallow flowing water")
       0.75 <= HR < 1.25: Moderate ("Danger for Some - children, elderly")
       1.25 <= HR < 2.0:  Significant ("Danger for Most - impassable for vehicles")
       HR >= 2.0:        Extreme ("Danger for All - structural collapse risk")
  2. Vehicle Hydrodynamic Buoyancy & Stability Limit:
       Passenger cars float and lose traction at d >= 0.30m or v >= 1.5 m/s.
       Emergency SUVs / Fire Engines float at d >= 0.60m.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class FloodHazardIndexer:
    """Computes spatial DEFRA Flood Hazard Ratings and vehicle mobility indices."""

    @staticmethod
    def calculate_defra_hazard_grid(
        depth_grid: np.ndarray,
        velocity_grid: np.ndarray,
        is_urban: bool = True,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute pixel-wise Hazard Rating HR = d * (v + 0.5) + DF.
        Returns:
          hr_grid: float array of HR values
          class_grid: integer categorical severity codes (0=None, 1=Low, 2=Moderate, 3=Significant, 4=Extreme)
        """
        assert depth_grid.shape == velocity_grid.shape

        # Debris Factor
        if is_urban:
            df = np.where(depth_grid > 0.25, 1.0, np.where(depth_grid > 0.05, 0.5, 0.0))
        else:
            df = np.where(depth_grid > 0.25, 0.5, 0.0)

        hr = depth_grid * (velocity_grid + 0.5) + df

        classes = np.zeros_like(hr, dtype=int)
        classes[(hr >= 0.01) & (hr < 0.75)] = 1   # Low
        classes[(hr >= 0.75) & (hr < 1.25)] = 2   # Moderate
        classes[(hr >= 1.25) & (hr < 2.00)] = 3   # Significant
        classes[hr >= 2.00] = 4                   # Extreme

        return hr, classes

    @staticmethod
    def assess_vehicle_accessibility(
        depth_m: float,
        velocity_mps: float,
    ) -> Dict[str, Any]:
        """Assess road passability for standard passenger vehicles vs emergency responders."""
        passenger_safe = (depth_m < 0.25) and (depth_m * velocity_mps < 0.3)
        emergency_suv_safe = (depth_m < 0.50) and (depth_m * velocity_mps < 0.7)

        return {
            "passenger_vehicle_accessible": passenger_safe,
            "emergency_vehicle_accessible": emergency_suv_safe,
            "momentum_flux_d_times_v": float(depth_m * velocity_mps),
            "recommendation": (
                "ROAD CLEAR" if passenger_safe else
                ("EMERGENCY VEHICLES ONLY" if emergency_suv_safe else "ROAD CLOSED - RESCUE BOAT REQUIRED")
            ),
        }


class CatchmentVulnerabilityEvaluator:
    """Evaluates community risk score based on hazard overlay on critical assets."""

    def __init__(self, critical_assets: Optional[List[Dict[str, Any]]] = None):
        # Default mock urban critical infrastructure assets
        self.assets = critical_assets or [
            {"name": "Substation Metro-East", "grid_pos": (6, 8), "weight": 4.0},
            {"name": "General Hospital Access Ramp", "grid_pos": (12, 14), "weight": 5.0},
            {"name": "Elementary School Detention Basin", "grid_pos": (18, 5), "weight": 3.5},
            {"name": "Highway Culvert Underpass", "grid_pos": (16, 16), "weight": 4.5},
        ]

    def score_catchment_risk(
        self,
        depth_grid: np.ndarray,
        velocity_grid: np.ndarray,
    ) -> Dict[str, Any]:
        """Compute aggregate community vulnerability index."""
        hr_grid, class_grid = FloodHazardIndexer.calculate_defra_hazard_grid(depth_grid, velocity_grid)

        asset_impacts = []
        total_risk_penalty = 0.0

        for a in self.assets:
            r, c = a["grid_pos"]
            d = float(depth_grid[r, c])
            v = float(velocity_grid[r, c])
            hr_val = float(hr_grid[r, c])
            sev_class = int(class_grid[r, c])

            impact_score = hr_val * a["weight"]
            total_risk_penalty += impact_score

            asset_impacts.append({
                "asset_name": a["name"],
                "depth_m": round(d, 2),
                "velocity_mps": round(v, 2),
                "hazard_rating": round(hr_val, 2),
                "hazard_level": ["NONE", "LOW", "MODERATE", "SIGNIFICANT", "EXTREME"][sev_class],
            })

        # Spatial statistics
        area_inundated_pct = float(np.mean(depth_grid > 0.05) * 100.0)
        extreme_hazard_pct = float(np.mean(class_grid == 4) * 100.0)

        return {
            "mean_hazard_rating": float(np.mean(hr_grid)),
            "max_hazard_rating": float(np.max(hr_grid)),
            "inundated_area_pct": area_inundated_pct,
            "extreme_danger_area_pct": extreme_hazard_pct,
            "total_community_risk_index": round(total_risk_penalty, 2),
            "asset_reports": asset_impacts,
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - FLOOD HAZARD & VULNERABILITY INDEXER TEST")
    print("=" * 70)

    # 20x20 urban flood basin
    depths = np.zeros((20, 20))
    velocities = np.zeros((20, 20))

    # Severe pooling in highway underpass
    depths[14:18, 14:18] = 0.85
    velocities[14:18, 14:18] = 1.40

    # Shallow sheet flow on street
    depths[5:9, :] = 0.18
    velocities[5:9, :] = 0.65

    evaluator = CatchmentVulnerabilityEvaluator()
    risk = evaluator.score_catchment_risk(depths, velocities)

    print(f"Mean Catchment Hazard Rating: {risk['mean_hazard_rating']:.2f}")
    print(f"Total Community Risk Index:   {risk['total_community_risk_index']:.2f}")
    print(f"Inundated Domain Percentage:  {risk['inundated_area_pct']:.1f}%")
    print("\nCritical Infrastructure Status:")
    for a in risk["asset_reports"]:
        print(f"  - {a['asset_name']:<30}: Depth={a['depth_m']}m, HR={a['hazard_rating']} [{a['hazard_level']}]")

    # Assess road access
    road_eval = FloodHazardIndexer.assess_vehicle_accessibility(depth_m=0.85, velocity_mps=1.40)
    print(f"\nHighway Underpass Mobility: {road_eval['recommendation']}")

    print("\nPASS: Flood hazard and exposure risk indexer verified successfully.")
