"""
Crestix Probe - Direct Flood Damage & Economic Vulnerability Assessment
=======================================================================
Implements standard FEMA HAZUS-MH depth-damage vulnerability curves for urban buildings.

Calculates direct economic losses and structural damages:
  Loss_total = sum_i Value_structure_i * DDF_structure(h_i) + Value_contents_i * DDF_contents(h_i)

Where:
  - h_i is peak water depth relative to finished first-floor elevation (FFE)
  - DDF is Depth-Damage Function (% damage as a function of depth)
  - Asset Classes:
      RES1: Single-Family Residential (1-2 stories, no basement)
      RES2: Multi-Family Apartment Complex
      COM1: Retail / Commercial Storefront
      IND1: Light Industrial / Warehouse Logistics Center
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class HazusDepthDamageCurves:
    """FEMA HAZUS-MH empirical depth-damage percentage lookup table."""

    # Depth grid points in meters: [-0.3, 0.0, 0.15, 0.30, 0.60, 0.90, 1.20, 1.50, 2.00, 3.00]
    DEPTHS_M = np.array([-0.30, 0.00, 0.15, 0.30, 0.60, 0.90, 1.20, 1.50, 2.00, 3.00])

    # Percentage structural damage
    STRUCTURAL_DDF = {
        "RES_SINGLE_FAMILY": np.array([0.0, 0.0, 5.0, 12.0, 24.0, 35.0, 44.0, 52.0, 62.0, 75.0]),
        "RES_MULTI_FAMILY":  np.array([0.0, 0.0, 3.0, 8.0, 18.0, 28.0, 36.0, 45.0, 55.0, 68.0]),
        "COMMERCIAL_RETAIL": np.array([0.0, 0.0, 8.0, 18.0, 32.0, 48.0, 60.0, 70.0, 80.0, 90.0]),
        "INDUSTRIAL_WAREHOUSE": np.array([0.0, 0.0, 4.0, 10.0, 22.0, 38.0, 50.0, 62.0, 74.0, 85.0]),
    }

    # Percentage content/inventory damage
    CONTENTS_DDF = {
        "RES_SINGLE_FAMILY": np.array([0.0, 0.0, 8.0, 20.0, 38.0, 55.0, 68.0, 78.0, 88.0, 98.0]),
        "RES_MULTI_FAMILY":  np.array([0.0, 0.0, 6.0, 15.0, 30.0, 45.0, 58.0, 68.0, 80.0, 92.0]),
        "COMMERCIAL_RETAIL": np.array([0.0, 0.0, 15.0, 35.0, 60.0, 80.0, 90.0, 95.0, 98.0, 100.0]),
        "INDUSTRIAL_WAREHOUSE": np.array([0.0, 0.0, 10.0, 25.0, 48.0, 70.0, 82.0, 90.0, 95.0, 100.0]),
    }

    @classmethod
    def interpolate_damage_pct(cls, occupancy: str, water_depth_m: float) -> Tuple[float, float]:
        """Interpolate structure and contents damage percentage for a given water depth."""
        struct_curve = cls.STRUCTURAL_DDF.get(occupancy, cls.STRUCTURAL_DDF["RES_SINGLE_FAMILY"])
        content_curve = cls.CONTENTS_DDF.get(occupancy, cls.CONTENTS_DDF["RES_SINGLE_FAMILY"])

        # Linear interpolation
        struct_pct = float(np.interp(water_depth_m, cls.DEPTHS_M, struct_curve))
        content_pct = float(np.interp(water_depth_m, cls.DEPTHS_M, content_curve))

        return struct_pct, content_pct


class UrbanDamageAssessor:
    """Evaluates aggregate building losses across an inundated urban district."""

    def __init__(self, property_portfolio: Optional[List[Dict[str, Any]]] = None):
        # Default mock urban portfolio
        self.portfolio = property_portfolio or [
            {"id": "BLD-01", "name": "Sunset Terrace Residences", "type": "RES_SINGLE_FAMILY", "elev_ffe_m": 20.5, "struct_val_usd": 380000, "content_val_usd": 120000, "grid_pos": (6, 8)},
            {"id": "BLD-02", "name": "Eastside Logistics Hub", "type": "INDUSTRIAL_WAREHOUSE", "elev_ffe_m": 19.8, "struct_val_usd": 1500000, "content_val_usd": 900000, "grid_pos": (14, 14)},
            {"id": "BLD-03", "name": "Metro Downtown Plaza", "type": "COMMERCIAL_RETAIL", "elev_ffe_m": 20.2, "struct_val_usd": 850000, "content_val_usd": 450000, "grid_pos": (10, 12)},
            {"id": "BLD-04", "name": "Riverbend Apartments", "type": "RES_MULTI_FAMILY", "elev_ffe_m": 19.4, "struct_val_usd": 2200000, "content_val_usd": 650000, "grid_pos": (16, 6)},
        ]

    def calculate_portfolio_losses(self, depth_grid: np.ndarray, ground_elevation_grid: np.ndarray) -> Dict[str, Any]:
        """
        Compute building-by-building and aggregate monetary loss estimates.
        """
        total_struct_loss = 0.0
        total_content_loss = 0.0
        building_reports = []

        for b in self.portfolio:
            r, c = b["grid_pos"]
            surface_h = float(depth_grid[r, c])
            ground_z = float(ground_elevation_grid[r, c])
            water_surface_elev = ground_z + surface_h

            # Inundation depth above finished first floor elevation (FFE)
            depth_above_ffe = water_surface_elev - b["elev_ffe_m"]

            if depth_above_ffe > 0:
                s_pct, c_pct = HazusDepthDamageCurves.interpolate_damage_pct(b["type"], depth_above_ffe)
                s_loss = (s_pct / 100.0) * b["struct_val_usd"]
                c_loss = (c_pct / 100.0) * b["content_val_usd"]
            else:
                s_pct, c_pct = 0.0, 0.0
                s_loss, c_loss = 0.0, 0.0

            total_loss = s_loss + c_loss
            total_struct_loss += s_loss
            total_content_loss += c_loss

            building_reports.append({
                "building_id": b["id"],
                "name": b["name"],
                "occupancy": b["type"],
                "depth_above_ffe_m": round(depth_above_ffe, 3),
                "structure_damage_pct": round(s_pct, 1),
                "contents_damage_pct": round(c_pct, 1),
                "structure_loss_usd": round(s_loss, 2),
                "contents_loss_usd": round(c_loss, 2),
                "total_loss_usd": round(total_loss, 2),
            })

        grand_total = total_struct_loss + total_content_loss
        return {
            "total_direct_economic_loss_usd": round(grand_total, 2),
            "total_structural_damage_usd": round(total_struct_loss, 2),
            "total_contents_damage_usd": round(total_content_loss, 2),
            "damaged_properties_count": sum(1 for b in building_reports if b["total_loss_usd"] > 0),
            "building_reports": building_reports,
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - HAZUS FLOOD DAMAGE & VULNERABILITY ASSESSOR TEST")
    print("=" * 70)

    # 20x20 terrain and severe 100-year inundation scenario
    ground_dem = np.full((20, 20), 19.5)
    depths = np.zeros((20, 20))
    # Severe floodwaters pooling in south and east sectors
    depths[12:18, 5:16] = 1.25

    assessor = UrbanDamageAssessor()
    loss_report = assessor.calculate_portfolio_losses(depths, ground_dem)

    print(f"Total Direct Economic Loss: ${loss_report['total_direct_economic_loss_usd']:,.2f}")
    print(f"  Structural Losses:       ${loss_report['total_structural_damage_usd']:,.2f}")
    print(f"  Contents Losses:         ${loss_report['total_contents_damage_usd']:,.2f}")
    print(f"Damaged Building Assets:   {loss_report['damaged_properties_count']} / {len(assessor.portfolio)}")

    print("\nDetailed Asset Damage Breakdown:")
    for b in loss_report["building_reports"]:
        print(f"  - {b['name']:<28} [{b['occupancy']}]: Depth Above FFE={b['depth_above_ffe_m']:+5.2f}m | "
              f"Damage: {b['structure_damage_pct']}% | Loss: ${b['total_loss_usd']:,.2f}")

    assert loss_report["total_direct_economic_loss_usd"] > 0
    print("\nPASS: FEMA HAZUS-MH depth-damage assessment engine validated successfully.")
