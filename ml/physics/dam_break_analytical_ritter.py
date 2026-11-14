"""
Crestix Probe - Ritter & Stoker Analytical Solutions for Dam-Breach Hydrodynamics
=================================================================================
Exact mathematical Riemann shock solutions for 1D/2D dam failure and bore propagation:
  1. Ritter Solution (Dry Bed Downstream, h_R = 0):
       Expansion wave celerity: c_0 = sqrt(g * h_0)
       Water depth profile:
         h(x, t) = (4 / (9 * g)) * (c_0 - x / (2 * t))^2   for -c_0 * t <= x <= 2 * c_0 * t
       Velocity profile:
         u(x, t) = (2 / 3) * (c_0 + x / t)
       Discharge at dam crest (x = 0):
         q(0, t) = (8 / 27) * c_0 * h_0
  2. Stoker Solution (Wet Bed Downstream, h_R > 0):
       Incorporates moving hydraulic jump (bore shock front) with Rankine-Hugoniot jump condition:
         v_shock = u_2 + c_2 * sqrt(1 + 0.5 * (h_shock - h_R) / h_R)
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any

GRAVITY = 9.80665


class AnalyticalDamBreachSolver:
    """Computes exact Riemann analytical profiles for shallow water verification."""

    def __init__(self, reservoir_depth_h0: float = 5.0, gravity: float = GRAVITY):
        self.h0 = reservoir_depth_h0
        self.g = gravity
        self.c0 = math.sqrt(gravity * reservoir_depth_h0)

    def ritter_profile_1d(
        self,
        x_coords_m: np.ndarray,
        time_seconds: float,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculates exact water depth h(x, t) and velocity u(x, t) over dry bed.
        Dam crest is at x = 0.
        Reservoir is in x < 0. Downstream dry channel is in x > 0.
        """
        assert time_seconds > 0, "Time must be strictly positive."
        t = time_seconds
        c0 = self.c0
        g = self.g

        h = np.zeros_like(x_coords_m, dtype=np.float64)
        u = np.zeros_like(x_coords_m, dtype=np.float64)

        # Three regions:
        # 1. Undisturbed reservoir: x <= -c0 * t
        mask_res = x_coords_m <= -c0 * t
        h[mask_res] = self.h0
        u[mask_res] = 0.0

        # 2. Rarefaction expansion fan: -c0 * t < x <= 2 * c0 * t
        mask_fan = (x_coords_m > -c0 * t) & (x_coords_m < 2.0 * c0 * t)
        x_fan = x_coords_m[mask_fan]
        c_fan = (2.0 / 3.0) * (c0 - x_fan / (2.0 * t))
        h[mask_fan] = (c_fan ** 2) / g
        u[mask_fan] = (2.0 / 3.0) * (c0 + x_fan / t)

        # 3. Dry bed ahead of wave tip: x >= 2 * c0 * t
        mask_dry = x_coords_m >= 2.0 * c0 * t
        h[mask_dry] = 0.0
        u[mask_dry] = 0.0

        return h, u

    def dam_crest_discharge(self) -> float:
        """Constant unit discharge passing dam axis x=0 in dry bed Ritter solution: q = (8/27)*c0*h0."""
        return (8.0 / 27.0) * self.c0 * self.h0

    def wave_front_position(self, time_seconds: float) -> float:
        """Position of leading wetting front tip x_tip(t) = 2 * c0 * t."""
        return 2.0 * self.c0 * time_seconds


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - RITTER DAM BREACH ANALYTICAL SOLUTION TEST")
    print("=" * 70)

    solver = AnalyticalDamBreachSolver(reservoir_depth_h0=4.0)
    print(f"Reservoir Depth: {solver.h0:.2f} m | Initial Wave Celerity c0: {solver.c0:.2f} m/s")
    print(f"Theoretical Dam Crest Discharge (x=0): {solver.dam_crest_discharge():.3f} m^2/s")

    t_eval = 5.0  # 5 seconds after breach
    x_grid = np.linspace(-40.0, 80.0, 121)
    h_exact, u_exact = solver.ritter_profile_1d(x_grid, time_seconds=t_eval)

    x_tip = solver.wave_front_position(t_eval)
    print(f"\nAt t = {t_eval}s post-breach:")
    print(f"  Wave Front Tip Position:   x = {x_tip:.2f} m")
    print(f"  Water Depth at Dam (x=0):  h = {h_exact[40]:.3f} m (Exact 4/9 * h0 = {4/9 * 4.0:.3f} m)")
    print(f"  Flow Velocity at Dam (x=0): u = {u_exact[40]:.3f} m/s")

    assert math.isclose(h_exact[40], (4.0 / 9.0) * 4.0, rel_tol=1e-2)
    print("\nPASS: Ritter analytical Riemann dam-breach benchmark validated successfully.")
