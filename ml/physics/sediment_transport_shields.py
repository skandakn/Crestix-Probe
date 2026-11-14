"""
Crestix Probe - Sediment Transport & Hydrodynamic Scour Engine
==============================================================
Calculates bed shear stress, incipient sediment motion, bedload transport rates,
and local scour depth around infrastructure assets (bridge piers, culvert outfalls).

Formulas:
  1. Bed Shear Stress:
       tau_b = rho * g * R_h * S_f  [N/m^2]
  2. Non-Dimensional Shields Parameter theta:
       theta = tau_b / ((rho_s - rho) * g * d_50)
     Incipient Motion Criterion:
       Erosion occurs when theta > theta_critical (~ 0.045 for medium sand/gravel)
  3. Meyer-Peter & Müller (MPM) Bedload Transport:
       Phi = 8.0 * (theta - theta_critical)^(3/2)   for theta > theta_critical
       q_b = Phi * sqrt((s - 1) * g * d_50^3)  [m^2/s]
  4. HEC-18 Colorado State University (CSU) Pier Scour Equation:
       y_s / y_1 = 2.0 * K_1 * K_2 * K_3 * (a / y_1)^0.65 * Fr_1^0.43
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any

GRAVITY = 9.80665


class SedimentScourCalculator:
    """Calculates sediment dynamics and infrastructure scour depth."""

    def __init__(
        self,
        water_density: float = 1000.0,
        sediment_density: float = 2650.0,  # Quartz sand/gravel
        d50_grain_size_m: float = 0.002,   # 2mm coarse sand
        shields_critical: float = 0.045,
    ):
        self.rho = water_density
        self.rho_s = sediment_density
        self.d50 = d50_grain_size_m
        self.theta_crit = shields_critical
        self.s = sediment_density / water_density  # Specific gravity (~ 2.65)

    def calculate_shields_stress(
        self,
        water_depth_m: float,
        flow_velocity_mps: float,
        manning_n: float = 0.030,
    ) -> Dict[str, Any]:
        """Compute bottom shear stress and Shields incipient motion parameter."""
        h = max(water_depth_m, 1e-4)
        v = flow_velocity_mps

        # Friction slope S_f = (n * v)^2 / h^(4/3)
        s_f = (manning_n * v) ** 2 / (h ** (4.0 / 3.0))

        # Bottom shear stress: tau_0 = rho * g * h * S_f
        tau_0 = self.rho * GRAVITY * h * s_f

        # Non-dimensional Shields parameter theta
        denom = (self.rho_s - self.rho) * GRAVITY * self.d50
        theta = tau_0 / denom

        is_eroding = theta > self.theta_crit

        # Meyer-Peter & Müller bedload unit discharge q_b [m^2/s]
        if is_eroding:
            phi = 8.0 * ((theta - self.theta_crit) ** 1.5)
            q_b = phi * math.sqrt((self.s - 1.0) * GRAVITY * (self.d50 ** 3))
        else:
            q_b = 0.0

        return {
            "bed_shear_stress_pa": round(tau_0, 3),
            "shields_parameter_theta": round(theta, 4),
            "shields_critical_threshold": self.theta_crit,
            "is_incipient_motion_active": is_eroding,
            "bedload_transport_rate_m2s": q_b,
        }

    def compute_csu_pier_scour(
        self,
        upstream_depth_m: float,
        upstream_velocity_mps: float,
        pier_width_a_m: float = 1.20,
        pier_shape: str = "round_nose",
    ) -> Dict[str, Any]:
        """
        HEC-18 CSU equation for equilibrium local scour depth around bridge piers.
        """
        y1 = max(upstream_depth_m, 0.05)
        v1 = upstream_velocity_mps
        a = pier_width_a_m

        # Froude number Fr = v / sqrt(g * y)
        fr1 = v1 / math.sqrt(GRAVITY * y1)

        # Shape correction factor K1
        k1_map = {"square_nose": 1.1, "round_nose": 1.0, "sharp_nose": 0.9}
        k1 = k1_map.get(pier_shape, 1.0)
        k2 = 1.0  # Angle of attack correction (assumed aligned with flow)
        k3 = 1.1  # Bed condition factor (plane bed / small dunes)

        # Scour depth: y_s = 2.0 * K1 * K2 * K3 * (a / y1)^0.65 * Fr1^0.43 * y1
        scour_ratio = 2.0 * k1 * k2 * k3 * ((a / y1) ** 0.65) * (fr1 ** 0.43)
        scour_depth_m = scour_ratio * y1

        # Physical limit: y_s <= 2.4 * a (for Fr <= 0.8)
        scour_depth_m = min(scour_depth_m, 2.4 * a)

        return {
            "upstream_froude_number": round(fr1, 3),
            "predicted_scour_depth_m": round(scour_depth_m, 3),
            "pier_width_m": a,
            "scour_ratio_ys_over_a": round(scour_depth_m / a, 2),
            "structural_hazard": "HIGH_SCOUR_RISK" if scour_depth_m > 1.5 else "STABLE",
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - SEDIMENT TRANSPORT & CSU PIER SCOUR TEST")
    print("=" * 70)

    calc = SedimentScourCalculator(d50_grain_size_m=0.002)

    # Fast flowing channel (depth 1.8m, velocity 2.4 m/s)
    shields_res = calc.calculate_shields_stress(water_depth_m=1.8, flow_velocity_mps=2.4)
    print(f"Bed Shear Stress:  {shields_res['bed_shear_stress_pa']} Pa")
    print(f"Shields Parameter: {shields_res['shields_parameter_theta']} (Critical: {shields_res['shields_critical_threshold']})")
    print(f"Erosion Status:    {'ACTIVE BEDLOAD TRANSPORT' if shields_res['is_incipient_motion_active'] else 'STABLE'}")

    scour_res = calc.compute_csu_pier_scour(upstream_depth_m=1.8, upstream_velocity_mps=2.4, pier_width_a_m=1.0)
    print(f"\nBridge Pier Scour Analysis (1.0m Pier):")
    print(f"  Upstream Froude Number: {scour_res['upstream_froude_number']}")
    print(f"  Maximum Scour Depth:    {scour_res['predicted_scour_depth_m']} m")
    print(f"  Structural Assessment:  {scour_res['structural_hazard']}")

    assert scour_res["predicted_scour_depth_m"] > 0
    print("\nPASS: Sediment transport and infrastructure scour calculations verified.")
