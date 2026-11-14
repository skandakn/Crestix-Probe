"""
Crestix Probe - Global Sobol Sensitivity Analysis & Variance Decomposition
===========================================================================
Quantifies the relative contribution of each hydrological input parameter to output flood variance.

Formulation (Saltelli et al., 2002):
  Total Model Output Variance:
    V(Y) = sum_i V_i + sum_i sum_{j>i} V_ij + ... + V_{1..k}
  First-Order Sensitivity Index:
    S_i = V_i / V(Y) = Var_{X_i}( E_{X_~i}[Y | X_i] ) / Var(Y)
    Measures the fractional variance reduction achieved if parameter X_i were fixed exactly.
  Total-Effect Sensitivity Index:
    S_{Ti} = 1 - Var_{X_~i}( E_{X_i}[Y | X_~i] ) / Var(Y)
    Captures both main effects and all non-linear interaction terms involving X_i.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Callable


class SobolSensitivityAnalyzer:
    """Computes first-order and total-order Sobol sensitivity indices."""

    def __init__(
        self,
        parameter_names: List[str],
        parameter_bounds: List[Tuple[float, float]],
        n_samples_base: int = 256,
        seed: int = 42,
    ):
        self.names = parameter_names
        self.bounds = parameter_bounds
        self.k = len(parameter_names)
        self.N = n_samples_base
        self.rng = np.random.default_rng(seed)

    def generate_saltelli_matrices(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generate Saltelli sample matrices A, B, and cross matrices A_B_i.
        Total evaluations required: N * (k + 2)
        """
        # Generate two independent random sample matrices A and B in [0, 1]^k
        A_unit = self.rng.uniform(0.0, 1.0, (self.N, self.k))
        B_unit = self.rng.uniform(0.0, 1.0, (self.N, self.k))

        # Scale to physical bounds
        A = np.zeros_like(A_unit)
        B = np.zeros_like(B_unit)
        for i, (low, high) in enumerate(self.bounds):
            A[:, i] = low + A_unit[:, i] * (high - low)
            B[:, i] = low + B_unit[:, i] * (high - low)

        # Cross matrices A_B_i (matrix A with column i replaced by column i from B)
        cross_matrices = []
        for i in range(self.k):
            ab_i = A.copy()
            ab_i[:, i] = B[:, i]
            cross_matrices.append(ab_i)

        return A, B, np.array(cross_matrices)

    def evaluate_sobol_indices(self, model_eval_func: Callable[[np.ndarray], np.ndarray]) -> Dict[str, Any]:
        """
        Evaluate model and calculate S_i (first order) and S_Ti (total order) indices.
        """
        A, B, cross = self.generate_saltelli_matrices()

        y_A = model_eval_func(A)
        y_B = model_eval_func(B)

        # Total variance
        y_all = np.concatenate([y_A, y_B])
        total_var = float(np.var(y_all))

        s_first = []
        s_total = []

        for i in range(self.k):
            y_AB_i = model_eval_func(cross[i])

            # First-order index S_i = (1/N) * sum(y_B * (y_AB_i - y_A)) / total_var
            v_i = float(np.mean(y_B * (y_AB_i - y_A)))
            s_i = max(0.0, v_i / max(total_var, 1e-6))
            s_first.append(s_i)

            # Total-order index S_Ti = (1 / (2*N)) * sum((y_A - y_AB_i)^2) / total_var
            v_ti = float(np.mean((y_A - y_AB_i) ** 2) / 2.0)
            s_ti = max(0.0, v_ti / max(total_var, 1e-6))
            s_total.append(s_ti)

        report = {}
        for idx, name in enumerate(self.names):
            report[name] = {
                "first_order_S_i": round(float(s_first[idx]), 3),
                "total_order_S_Ti": round(float(s_total[idx]), 3),
                "interaction_effect": round(float(s_total[idx] - s_first[idx]), 3),
            }

        return {
            "total_model_variance": round(total_var, 4),
            "parameters": report,
            "most_influential_parameter": self.names[int(np.argmax(s_total))],
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - GLOBAL SOBOL SENSITIVITY ANALYSIS TEST")
    print("=" * 70)

    params = ["Rainfall_Depth_mm", "Curve_Number_CN", "Manning_n", "Channel_Slope"]
    bounds = [
        (40.0, 120.0),  # Rainfall
        (75.0, 95.0),   # CN
        (0.015, 0.080), # Manning n
        (0.002, 0.030), # Slope
    ]

    # Non-linear flood surrogate function
    def flood_depth_model(X: np.ndarray) -> np.ndarray:
        rain = X[:, 0]
        cn = X[:, 1]
        n = X[:, 2]
        slope = X[:, 3]
        # Inundation depth physics: strong rain & CN influence, inverse slope
        depth = 0.012 * (rain * (cn / 85.0)) ** 1.3 * (n / 0.035) ** 0.3 / np.sqrt(np.maximum(slope, 0.001))
        return depth

    analyzer = SobolSensitivityAnalyzer(params, bounds, n_samples_base=300)
    print(f"Running Saltelli sampling ({300 * (4 + 2)} model evaluations)...")
    results = analyzer.evaluate_sobol_indices(flood_depth_model)

    print(f"\nTotal Output Variance: {results['total_model_variance']}\n")
    print(f"{'Parameter Name':<22} | {'First Order (S_i)':<18} | {'Total Order (S_Ti)':<18}")
    print("-" * 62)
    for p_name, vals in results["parameters"].items():
        print(f"{p_name:<22} | {vals['first_order_S_i']:<18.3f} | {vals['total_order_S_Ti']:<18.3f}")

    print(f"\nPrimary Flood Driver: {results['most_influential_parameter']}")
    assert results["most_influential_parameter"] in ["Rainfall_Depth_mm", "Channel_Slope"]
    print("\nPASS: Global Sobol sensitivity analysis validated successfully.")
