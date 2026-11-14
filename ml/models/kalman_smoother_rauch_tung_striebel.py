"""
Crestix Probe - Rauch-Tung-Striebel (RTS) Offline Post-Event Kalman Smoother
============================================================================
Optimal two-pass fixed-interval smoothing algorithm for retrospective reanalysis
of flash flood stage hydrographs.

Algorithm Passes:
  1. Forward Pass (Standard Kalman Filter):
       x_k^f, P_k^f = Predict(x_{k-1}^a, P_{k-1}^a)
       x_k^a, P_k^a = Update(x_k^f, P_k^f, z_k)
  2. Backward Pass (RTS Smoother):
       Smoother Gain: C_k = P_k^a * F^T * (P_{k+1}^f)^(-1)
       Smoothed State: x_k^s = x_k^a + C_k * (x_{k+1}^s - x_{k+1}^f)
       Smoothed Covariance: P_k^s = P_k^a + C_k * (P_{k+1}^s - P_{k+1}^f) * C_k^T

Advantages over real-time filtering:
  - Zero Phase Lag (symmetric double-pass conditioning on all past and future observations)
  - Lower state estimation uncertainty across the entire storm hydrograph
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class RauchTungStriebelSmoother:
    """Two-pass optimal fixed-interval smoother for linear state-space systems."""

    def __init__(
        self,
        dt_seconds: float = 1.0,
        process_variance_q: float = 0.02,
        measurement_variance_r: float = 0.85,
    ):
        self.dt = dt_seconds
        # 2D state vector: [water_depth (cm), rate_of_rise (cm/s)]
        self.F = np.array([[1.0, dt_seconds], [0.0, 1.0]])  # State transition
        self.H = np.array([[1.0, 0.0]])                     # Measurement matrix

        # Process and measurement covariances
        self.Q = np.array([
            [(dt_seconds ** 4) / 4.0, (dt_seconds ** 3) / 2.0],
            [(dt_seconds ** 3) / 2.0, dt_seconds ** 2]
        ]) * process_variance_q
        self.R = np.array([[measurement_variance_r]])

    def smooth_trajectory(self, measurements: np.ndarray) -> Dict[str, Any]:
        """
        Executes forward Kalman filter pass followed by backward RTS smoother pass.
        measurements: 1D array of noisy depth observations (cm).
        """
        N = len(measurements)

        # Forward storage arrays
        x_pred = np.zeros((N, 2))
        P_pred = np.zeros((N, 2, 2))
        x_filt = np.zeros((N, 2))
        P_filt = np.zeros((N, 2, 2))

        # Initial conditions
        x_curr = np.array([measurements[0], 0.0])
        P_curr = np.eye(2) * 2.0

        # === 1. FORWARD PASS ===
        for k in range(N):
            if k > 0:
                # Time update (Predict)
                x_curr = np.dot(self.F, x_curr)
                P_curr = np.dot(np.dot(self.F, P_curr), self.F.T) + self.Q

            x_pred[k] = x_curr
            P_pred[k] = P_curr

            # Measurement update (Correct)
            z = np.array([measurements[k]])
            y = z - np.dot(self.H, x_curr)
            S = np.dot(np.dot(self.H, P_curr), self.H.T) + self.R
            K = np.dot(np.dot(P_curr, self.H.T), np.linalg.inv(S))

            x_curr = x_curr + np.dot(K, y)
            P_curr = np.dot(np.eye(2) - np.dot(K, self.H), P_curr)

            x_filt[k] = x_curr
            P_filt[k] = P_curr

        # === 2. BACKWARD PASS (RTS) ===
        x_smooth = np.zeros((N, 2))
        P_smooth = np.zeros((N, 2, 2))

        # Initialize end of backward pass with final filtered state
        x_smooth[-1] = x_filt[-1]
        P_smooth[-1] = P_filt[-1]

        for k in range(N - 2, -1, -1):
            # Smoother gain C_k = P_k^a * F^T * (P_{k+1}^f)^(-1)
            P_inv = np.linalg.pinv(P_pred[k + 1])
            C = np.dot(np.dot(P_filt[k], self.F.T), P_inv)

            # State update
            x_diff = x_smooth[k + 1] - x_pred[k + 1]
            x_smooth[k] = x_filt[k] + np.dot(C, x_diff)

            # Covariance update
            P_diff = P_smooth[k + 1] - P_pred[k + 1]
            P_smooth[k] = P_filt[k] + np.dot(np.dot(C, P_diff), C.T)

        smoothed_depths = np.maximum(x_smooth[:, 0], 0.0)
        filtered_depths = np.maximum(x_filt[:, 0], 0.0)
        smoothed_stds = np.sqrt(P_smooth[:, 0, 0])

        return {
            "smoothed_depths_cm": smoothed_depths.tolist(),
            "filtered_depths_cm": filtered_depths.tolist(),
            "smoothed_uncertainty_cm": smoothed_stds.tolist(),
            "mean_variance_reduction_pct": float(
                (1.0 - np.mean(P_smooth[:, 0, 0]) / np.mean(P_filt[:, 0, 0])) * 100.0
            ),
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - RAUCH-TUNG-STRIEBEL (RTS) KALMAN SMOOTHER TEST")
    print("=" * 70)

    # Synthetic flash flood wave
    t = np.linspace(0, 60, 60)
    true_h = 10.0 + 25.0 * np.exp(-((t - 25.0) / 8.0) ** 2)
    # Noisy sensor readings
    rng = np.random.default_rng(42)
    noisy_obs = true_h + rng.normal(0, 1.8, 60)

    smoother = RauchTungStriebelSmoother(dt_seconds=1.0)
    res = smoother.smooth_trajectory(noisy_obs)

    h_smooth = np.array(res["smoothed_depths_cm"])
    h_filt = np.array(res["filtered_depths_cm"])

    rmse_noisy = float(np.sqrt(np.mean((noisy_obs - true_h) ** 2)))
    rmse_filt = float(np.sqrt(np.mean((h_filt - true_h) ** 2)))
    rmse_smooth = float(np.sqrt(np.mean((h_smooth - true_h) ** 2)))

    print(f"Raw Measurement Noise RMSE:   {rmse_noisy:.3f} cm")
    print(f"Forward Filtered (Lagged) RMSE: {rmse_filt:.3f} cm")
    print(f"RTS Offline Smoothed RMSE:    {rmse_smooth:.3f} cm")
    print(f"Variance Uncertainty Reduction: {res['mean_variance_reduction_pct']:.1f}%")

    assert rmse_smooth < rmse_filt, "RTS smoother should be more accurate than single-pass forward filter!"
    print("\nPASS: Rauch-Tung-Striebel optimal smoother validated successfully.")
