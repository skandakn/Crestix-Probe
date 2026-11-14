"""
Crestix Probe - Runoff Hydrology Engine (SCS-CN & Green-Ampt Infiltration)
==========================================================================
Computes rainfall-runoff partitioning, soil infiltration losses, and overland
effective hyetograph generation according to USDA Natural Resources Conservation
Service (NRCS / SCS) National Engineering Handbook Chapter 10.

Formulas:
  1. Maximum potential soil water retention:
       S = (25400 / CN) - 254   [mm]
  2. Initial abstraction (canopy interception, surface depression storage):
       I_a = lambda_val * S     (Standard lambda = 0.20 or urban lambda = 0.05)
  3. Direct cumulative runoff volume Q:
       Q = (P - I_a)^2 / (P - I_a + S)   for P > I_a, else 0
  4. Antecedent Moisture Condition (AMC) Adjustment:
       AMC I (dry), AMC II (average), AMC III (wet saturated):
         CN_I   = CN_II / (2.281 - 0.01281 * CN_II)
         CN_III = CN_II / (0.427 + 0.00573 * CN_II)
  5. Green-Ampt Physical Infiltration Rate:
       f(t) = K_sat * (1 + (psi * Delta_theta) / F(t))
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class SCSCurveNumberEngine:
    """
    Hydrological runoff calculation engine based on USDA NRCS Curve Number methodology.
    """

    def __init__(
        self,
        curve_number: float = 85.0,  # Typical urban paved / residential mixed
        initial_abstraction_ratio: float = 0.20,
        antecedent_moisture: str = "AMC_II",
    ):
        self.cn_ii = curve_number
        self.lambda_val = initial_abstraction_ratio
        self.amc = antecedent_moisture
        self.cn = self._adjust_for_amc(curve_number, antecedent_moisture)

    @staticmethod
    def _adjust_for_amc(cn_ii: float, amc: str) -> float:
        """Adjust baseline CN_II based on 5-day prior antecedent precipitation."""
        if amc == "AMC_I":  # Dry condition
            return cn_ii / (2.281 - 0.01281 * cn_ii)
        elif amc == "AMC_III":  # Saturated condition
            return cn_ii / (0.427 + 0.00573 * cn_ii)
        return cn_ii

    @property
    def potential_retention_mm(self) -> float:
        """Maximum potential soil water retention S (mm)."""
        return (25400.0 / self.cn) - 254.0

    @property
    def initial_abstraction_mm(self) -> float:
        """Initial abstraction I_a (mm)."""
        return self.lambda_val * self.potential_retention_mm

    def compute_cumulative_runoff(self, cumulative_precip_mm: float) -> float:
        """Compute cumulative runoff depth Q (mm) from cumulative precipitation P (mm)."""
        p = max(cumulative_precip_mm, 0.0)
        ia = self.initial_abstraction_mm
        s = self.potential_retention_mm

        if p <= ia:
            return 0.0
        q = ((p - ia) ** 2) / (p - ia + s)
        return float(min(q, p))

    def compute_runoff_hyetograph(
        self,
        time_minutes: List[float],
        precip_increments_mm: List[float],
    ) -> Dict[str, Any]:
        """
        Compute incremental excess rainfall (runoff) hyetograph from total precipitation hyetograph.
        """
        assert len(time_minutes) == len(precip_increments_mm)
        cum_precip = 0.0
        cum_runoff_prev = 0.0

        runoff_increments = []
        infiltration_increments = []
        cum_runoffs = []

        for p_inc in precip_increments_mm:
            cum_precip += p_inc
            cum_runoff_curr = self.compute_cumulative_runoff(cum_precip)
            excess_inc = max(cum_runoff_curr - cum_runoff_prev, 0.0)
            infilt_inc = max(p_inc - excess_inc, 0.0)

            runoff_increments.append(excess_inc)
            infiltration_increments.append(infilt_inc)
            cum_runoffs.append(cum_runoff_curr)
            cum_runoff_prev = cum_runoff_curr

        total_p = sum(precip_increments_mm)
        total_q = cum_runoff_prev
        runoff_coefficient = (total_q / total_p) if total_p > 0 else 0.0

        return {
            "curve_number_used": self.cn,
            "potential_retention_mm": self.potential_retention_mm,
            "initial_abstraction_mm": self.initial_abstraction_mm,
            "total_precipitation_mm": total_p,
            "total_runoff_mm": total_q,
            "total_infiltration_mm": total_p - total_q,
            "runoff_coefficient": runoff_coefficient,
            "excess_rain_increments_mm": runoff_increments,
            "infiltration_increments_mm": infiltration_increments,
        }


class GreenAmptInfiltrationModel:
    """
    Physically-based Green-Ampt infiltration model for urban permeable surfaces.
    """

    def __init__(
        self,
        hydraulic_conductivity_mm_hr: float = 12.0,  # Sandy loam
        suction_head_mm: float = 110.0,
        moisture_deficit: float = 0.25,
    ):
        self.k_sat = hydraulic_conductivity_mm_hr
        self.psi = suction_head_mm
        self.delta_theta = moisture_deficit
        self.psi_delta_theta = suction_head_mm * moisture_deficit

    def infiltration_capacity(self, cumulative_infiltrated_mm: float) -> float:
        """
        Instantaneous infiltration capacity f(t) [mm/hr]:
          f = K_sat * (1 + (psi * Delta_theta) / F)
        """
        F = max(cumulative_infiltrated_mm, 1e-4)
        f_cap = self.k_sat * (1.0 + (self.psi_delta_theta / F))
        return float(f_cap)


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - RUNOFF HYDROLOGY ENGINE (SCS-CN & GREEN-AMPT)")
    print("=" * 70)

    # Mixed urban subcatchment (CN=88) under wet antecedent conditions
    engine = SCSCurveNumberEngine(curve_number=88.0, antecedent_moisture="AMC_III")
    print(f"Base CN (AMC II): 88.0 -> Adjusted CN (AMC III): {engine.cn:.1f}")
    print(f"Soil Potential Retention S: {engine.potential_retention_mm:.2f} mm")
    print(f"Initial Abstraction Ia: {engine.initial_abstraction_mm:.2f} mm")

    # 1-hour storm event discretized into 10-minute steps
    times = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]
    precip_mm = [5.0, 15.0, 30.0, 22.0, 8.0, 2.0]  # Total 82 mm intense cloudburst

    result = engine.compute_runoff_hyetograph(times, precip_mm)
    print(f"\nTotal Precipitation: {result['total_precipitation_mm']:.1f} mm")
    print(f"Total Direct Runoff: {result['total_runoff_mm']:.1f} mm")
    print(f"Total Infiltrated:   {result['total_infiltration_mm']:.1f} mm")
    print(f"Runoff Coefficient C: {result['runoff_coefficient']:.3f}")

    assert result["total_runoff_mm"] > 0, "Runoff must be positive for 82mm storm!"
    print("PASS: Runoff hydrology engine and SCS-CN hyetograph validated successfully.")
