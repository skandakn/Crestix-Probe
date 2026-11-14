"""
Crestix Probe - 2D Ensemble Kalman Filter (EnKF) for Hydrodynamic Data Assimilation
===================================================================================
Fuses physical 2D shallow water simulations with streaming real-time IoT probe
telemetry (ultrasonic stage sensors, galvanic contact pins).

EnKF Algorithm:
  1. Forecast Step:
     Each ensemble member x_i^f (i=1..M) is propagated forward in time by the
     stochastic hydrodynamic numerical model with perturbed rainfall and friction:
       x_i^f = M(x_i^a_{t-1}) + w_i,   w_i ~ N(0, Q)
  2. Analysis Step:
     When sensor observations y_obs arrive at spatial probe coordinates:
       x_i^a = x_i^f + K * (y_obs + v_i - H * x_i^f),   v_i ~ N(0, R)
     Where Kalman Gain K is:
       K = P^f * H^T * (H * P^f * H^T + R)^(-1)
     Computed efficiently in ensemble subspace without explicit covariance matrix inversion.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class HydrodynamicEnKF2D:
    """
    Two-dimensional Ensemble Kalman Filter for urban flood inundation assimilation.
    State vector x represents gridded water depth field of size (nx, ny).
    """

    def __init__(
        self,
        grid_shape: Tuple[int, int] = (20, 20),
        ensemble_size: int = 30,
        obs_variance: float = 0.0025,  # 5cm standard deviation in ultrasonic depth
        process_variance: float = 0.0010,
        inflation_factor: float = 1.05,
        seed: int = 42,
    ):
        self.nx, self.ny = grid_shape
        self.state_dim = self.nx * self.ny
        self.ensemble_size = ensemble_size
        self.obs_var = obs_variance
        self.proc_var = process_variance
        self.inflation = inflation_factor
        self.rng = np.random.default_rng(seed)

        # Initialize ensemble matrix of shape (state_dim, ensemble_size)
        self.ensemble = np.zeros((self.state_dim, self.ensemble_size), dtype=np.float64)
        self._initialize_ensemble(prior_mean_depth=0.20, prior_std_depth=0.08)

    def _initialize_ensemble(self, prior_mean_depth: float, prior_std_depth: float):
        """Initialize ensemble with spatially correlated random Gaussian perturbations."""
        for m in range(self.ensemble_size):
            noise_2d = self.rng.normal(0.0, prior_std_depth, (self.nx, self.ny))
            # Smooth spatially with a simple 3x3 box blur filter
            smoothed_noise = np.pad(noise_2d, 1, mode='edge')
            field = np.zeros((self.nx, self.ny))
            for i in range(3):
                for j in range(3):
                    field += smoothed_noise[i:i+self.nx, j:j+self.ny]
            field /= 9.0

            depth_member = np.maximum(prior_mean_depth + field, 0.0)
            self.ensemble[:, m] = depth_member.flatten()

    @property
    def ensemble_mean(self) -> np.ndarray:
        """Ensemble mean state vector reshaped as 2D spatial grid (nx, ny)."""
        return np.mean(self.ensemble, axis=1).reshape((self.nx, self.ny))

    @property
    def ensemble_std(self) -> np.ndarray:
        """Ensemble uncertainty (standard deviation) as 2D spatial grid (nx, ny)."""
        return np.std(self.ensemble, axis=1).reshape((self.nx, self.ny))

    def forecast_step(
        self,
        rainfall_rate: float,
        dt_seconds: float = 60.0,
        bed_slopes: Optional[np.ndarray] = None,
    ):
        """
        Propagate each ensemble member forward in time via simplified 2D mass continuity routing.
        """
        for m in range(self.ensemble_size):
            depth_grid = self.ensemble[:, m].reshape((self.nx, self.ny))

            # Stochastic rainfall forcing per member
            rain_pert = rainfall_rate * (1.0 + self.rng.normal(0.0, 0.15))
            # Mass addition: dh = rain * dt
            depth_grid += (rain_pert / 3600.0) * (dt_seconds / 1000.0)

            # Drainage / downstream conveyance: slight advection along bed slope
            if bed_slopes is not None:
                # Outflow proportional to h^(5/3) * sqrt(S)
                conveyance = 0.05 * np.power(np.maximum(depth_grid, 0.0), 1.4) * np.sqrt(np.maximum(bed_slopes, 1e-4))
                depth_grid -= conveyance * (dt_seconds / 60.0)

            # Add process model noise and enforce positivity
            noise = self.rng.normal(0.0, np.sqrt(self.proc_var), (self.nx, self.ny))
            depth_grid = np.maximum(depth_grid + noise, 0.0)

            self.ensemble[:, m] = depth_grid.flatten()

        # Multiplicative covariance inflation to prevent filter divergence
        mean_vec = np.mean(self.ensemble, axis=1, keepdims=True)
        self.ensemble = mean_vec + self.inflation * (self.ensemble - mean_vec)
        self.ensemble = np.maximum(self.ensemble, 0.0)

    def analysis_step(
        self,
        sensor_locations: List[Tuple[int, int]],
        sensor_readings: List[float],
        sensor_types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Assimilate discrete sensor probe observations into 2D ensemble.
        sensor_locations: list of (row, col) grid coordinates
        sensor_readings: list of observed depths in meters
        """
        p = len(sensor_locations)
        if p == 0:
            return {"status": "no_observations"}

        # Observation operator H of shape (p, state_dim)
        H = np.zeros((p, self.state_dim), dtype=np.float64)
        for i, (r, c) in enumerate(sensor_locations):
            idx = r * self.ny + c
            H[i, idx] = 1.0

        # Projected ensemble in observation space: Y_f = H * X_f, shape (p, M)
        Y_f = np.dot(H, self.ensemble)
        y_mean = np.mean(Y_f, axis=1, keepdims=True)
        Y_prime = Y_f - y_mean  # Observation anomalies

        # State anomalies: X_prime, shape (state_dim, M)
        x_mean = np.mean(self.ensemble, axis=1, keepdims=True)
        X_prime = self.ensemble - x_mean

        # Observation error covariance matrix R, shape (p, p)
        R = np.eye(p, dtype=np.float64) * self.obs_var

        # Innovation covariance: S = (1 / (M - 1)) * Y_prime * Y_prime^T + R
        M = self.ensemble_size
        S = (1.0 / (M - 1)) * np.dot(Y_prime, Y_prime.T) + R

        # Invert innovation covariance S (p x p is small: typically 1 to 16 probes)
        S_inv = np.linalg.pinv(S)

        # Cross-covariance: P_xy = (1 / (M - 1)) * X_prime * Y_prime^T
        P_xy = (1.0 / (M - 1)) * np.dot(X_prime, Y_prime.T)

        # Kalman Gain: K = P_xy * S_inv, shape (state_dim, p)
        K = np.dot(P_xy, S_inv)

        # Perturbed observation vector per ensemble member
        innovations = []
        for m in range(M):
            # Perturb observation: y_perturbed = y_obs + v_m, v_m ~ N(0, R)
            v_m = self.rng.normal(0.0, np.sqrt(self.obs_var), size=p)
            y_m = np.array(sensor_readings) + v_m

            # Innovation vector
            d_m = y_m - Y_f[:, m]
            if m == 0:
                innovations = d_m.tolist()

            # State update
            self.ensemble[:, m] += np.dot(K, d_m)

        # Ensure physical depth constraint (h >= 0)
        self.ensemble = np.maximum(self.ensemble, 0.0)

        # Compute post-analysis innovation stats
        new_mean = self.ensemble_mean
        sim_at_sensors = [float(new_mean[r, c]) for (r, c) in sensor_locations]
        post_residuals = [obs - sim for obs, sim in zip(sensor_readings, sim_at_sensors)]
        rmse_post = float(np.sqrt(np.mean(np.array(post_residuals) ** 2)))

        return {
            "num_sensors": p,
            "rmse_post_analysis": rmse_post,
            "sensor_innovations": innovations,
            "mean_uncertainty_reduction_pct": float(
                (1.0 - (np.mean(self.ensemble_std) / 0.08)) * 100.0
            ),
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - 2D ENSEMBLE KALMAN FILTER (EnKF) DATA ASSIMILATION")
    print("=" * 70)

    enkf = HydrodynamicEnKF2D(grid_shape=(20, 20), ensemble_size=25, obs_variance=0.0009)
    print(f"Initial ensemble created: 25 members across 20x20 domain (400 states).")
    print(f"Initial Mean Depth: {np.mean(enkf.ensemble_mean):.3f} m, Std: {np.mean(enkf.ensemble_std):.3f} m")

    # Simulate 3 forecast cycles with 45 mm/hr storm rainfall
    for step in range(1, 4):
        enkf.forecast_step(rainfall_rate=45.0, dt_seconds=60.0)
    print(f"After 3 forecast steps -> Mean Depth: {np.mean(enkf.ensemble_mean):.3f} m")

    # Distributed physical probe sensor locations (e.g. river_sensor_alpha, beta, gamma)
    probes = [(8, 8), (10, 12), (15, 6)]
    # Real-time depths measured by ultrasonic probe
    probe_measurements = [0.48, 0.52, 0.39]

    print("\nAssimilating probe observations via EnKF analysis update...")
    analysis_res = enkf.analysis_step(probes, probe_measurements)

    print(f"Post-Analysis Sensor RMSE: {analysis_res['rmse_post_analysis'] * 100:.2f} cm")
    print(f"Innovations at Probes: {[round(x, 4) for x in analysis_res['sensor_innovations']]}")
    print(f"Updated Field Mean Depth: {np.mean(enkf.ensemble_mean):.3f} m, Post-assimilation Std: {np.mean(enkf.ensemble_std):.3f} m")
    print("PASS: 2D EnKF assimilation pipeline executed successfully.")
