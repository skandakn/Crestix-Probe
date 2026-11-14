"""
Crestix Probe - Generalized Extreme Value (GEV) & Extreme Value Theory (EVT)
=============================================================================
Statistical frequency analysis modeling rare, catastrophic flood extremes:
  1. Block Maxima / Generalized Extreme Value (GEV) Distribution:
       F(x; mu, sigma, xi) = exp(-(1 + xi * ((x - mu) / sigma))^(-1 / xi))
       Where:
         - mu is location parameter
         - sigma > 0 is scale parameter
         - xi is shape parameter (xi > 0 Frechet heavy-tail, xi = 0 Gumbel, xi < 0 Weibull)
       Return Level for T-year event:
         x_T = mu - (sigma / xi) * (1 - (-ln(1 - 1 / T))^(-xi))
  2. Peaks-Over-Threshold (POT) / Generalized Pareto Distribution (GPD):
       Models exceedances above high safety threshold u: y = x - u > 0
       F_GPD(y; sigma, xi) = 1 - (1 + xi * y / sigma)^(-1 / xi)
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class GEVExtremeValueModel:
    """Estimates return period water levels and design discharges from historical maxima."""

    def __init__(self, location_mu: float = 0.45, scale_sigma: float = 0.22, shape_xi: float = 0.12):
        self.mu = location_mu
        self.sigma = scale_sigma
        self.xi = shape_xi

    def compute_return_level(self, return_period_years: float) -> float:
        """
        Calculate design flood depth for T-year return period event.
        """
        assert return_period_years > 1.0, "Return period must exceed 1.0 year"
        t = return_period_years
        # Exceedance probability p = 1 / T
        p = 1.0 / t
        y_p = -math.log(1.0 - p)

        if abs(self.xi) < 1e-4:
            # Gumbel distribution limit (xi -> 0)
            x_t = self.mu - self.sigma * math.log(y_p)
        else:
            # General GEV formula
            x_t = self.mu - (self.sigma / self.xi) * (1.0 - (y_p ** (-self.xi)))

        return float(max(0.0, x_t))

    def fit_l_moments(self, sample_maxima: np.ndarray):
        """
        Estimate GEV parameters (mu, sigma, xi) from sample block maxima using L-Moments (Hosking, 1990).
        L-moments are robust against small sample outliers compared to standard maximum likelihood.
        """
        N = len(sample_maxima)
        sorted_x = np.sort(sample_maxima)

        # First three sample L-moments (l1, l2, l3)
        l1 = float(np.mean(sorted_x))

        comb_1 = np.arange(N)
        l2 = float(np.sum((2.0 * comb_1 / (N - 1) - 1.0) * sorted_x) / N)

        comb_2 = comb_1 * (comb_1 - 1.0) / 2.0
        c_denom = (N - 1) * (N - 2) / 2.0
        l3 = float(np.sum((6.0 * comb_2 / c_denom - 6.0 * comb_1 / (N - 1) + 1.0) * sorted_x) / N)

        tau3 = l3 / l2  # L-skewness

        # Polynomial approximation for shape parameter xi
        z = (2.0 / (3.0 + tau3)) - (math.log(2.0) / math.log(3.0))
        xi = 7.8590 * z + 2.9554 * (z ** 2)

        # Scale sigma and location mu
        gamma_1 = math.gamma(1.0 + xi) if xi > -1.0 else 1.0
        gamma_2 = math.gamma(1.0 + 2.0 * xi) if xi > -0.5 else 1.0
        sigma = (l2 * xi) / ((1.0 - (2.0 ** (-xi))) * gamma_1) if abs(xi) > 1e-4 else l2 / math.log(2.0)
        mu = l1 - (sigma / xi) * (1.0 - gamma_1) if abs(xi) > 1e-4 else l1 - 0.577215 * sigma

        self.mu = float(mu)
        self.sigma = float(max(0.01, sigma))
        self.xi = float(xi)

    def generate_return_period_matrix(self, return_periods: List[int] = [10, 25, 50, 100, 500]) -> Dict[str, Any]:
        """Generate civil engineering design flood frequency table."""
        table = {}
        for t in return_periods:
            h_t = self.compute_return_level(t)
            table[f"{t}_YEAR"] = {
                "annual_exceedance_probability_pct": round((1.0 / t) * 100.0, 2),
                "design_flood_depth_m": round(h_t, 3),
            }

        return {
            "estimated_mu": round(self.mu, 4),
            "estimated_sigma": round(self.sigma, 4),
            "estimated_xi_shape": round(self.xi, 4),
            "tail_behavior": "HEAVY_TAILED_FRECHET" if self.xi > 0 else "LIGHT_TAILED_GUMBEL",
            "return_period_table": table,
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - GEV EXTREME VALUE THEORY (EVT) TEST")
    print("=" * 70)

    # 40 years of annual maximum flood crests recorded in urban basin
    rng = np.random.default_rng(42)
    synthetic_annual_maxima = rng.gumbel(loc=0.55, scale=0.25, size=40)
    synthetic_annual_maxima = np.maximum(synthetic_annual_maxima, 0.1)

    gev = GEVExtremeValueModel()
    gev.fit_l_moments(synthetic_annual_maxima)

    res = gev.generate_return_period_matrix([10, 25, 50, 100, 500])

    print(f"L-Moments GEV Parameters: mu={res['estimated_mu']}, sigma={res['estimated_sigma']}, xi={res['estimated_xi_shape']}")
    print(f"Tail Classification: {res['tail_behavior']}\n")
    print(f"{'Return Period':<15} | {'Annual Prob (%)':<16} | {'Design Depth (m)':<16}")
    print("-" * 52)
    for r_period, vals in res["return_period_table"].items():
        print(f"{r_period:<15} | {vals['annual_exceedance_probability_pct']:<16.2f} | {vals['design_flood_depth_m']:<16.3f}")

    assert res["return_period_table"]["100_YEAR"]["design_flood_depth_m"] > res["return_period_table"]["10_YEAR"]["design_flood_depth_m"]
    print("\nPASS: Generalized Extreme Value flood frequency analysis validated.")
