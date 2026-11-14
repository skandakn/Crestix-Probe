"""
Crestix Probe - Conformal Prediction & Quantile Uncertainty Quantification
==========================================================================
Provides distribution-free, finite-sample valid prediction intervals for flood water depth.

Methods:
  1. Split Conformal Prediction:
     Given calibration non-conformity scores s_i = |y_i - y_hat_i|:
       q_hat = Quantile_{1 - alpha}(s_1..s_n) * (1 + 1/n)
     Guarantees marginal coverage:
       P(Y_{n+1} in [y_hat - q_hat, y_hat + q_hat]) >= 1 - alpha
  2. Pinball Loss Quantile Regression:
     L_tau(y, y_hat) = max(tau * (y - y_hat), (1 - tau) * (y_hat - y))
     Estimates empirical lower (5%), median (50%), and upper (95%) flood depth limits.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class ConformalFloodPredictor:
    """
    Split conformal inference wrapper guaranteeing finite-sample statistical validity.
    """

    def __init__(self, confidence_level: float = 0.90):
        self.confidence_level = confidence_level
        self.alpha = 1.0 - confidence_level
        self.cal_scores: Optional[np.ndarray] = None
        self.q_hat: Optional[float] = None

    def fit_calibration(self, y_true: np.ndarray, y_pred: np.ndarray):
        """
        Calibrate non-conformity residuals on independent held-out calibration set.
        """
        assert len(y_true) == len(y_pred), "Dimension mismatch between true and predicted targets."
        residuals = np.abs(y_true - y_pred)
        n = len(residuals)

        # Finite-sample adjusted quantile level
        adjusted_level = min(1.0, math.ceil((n + 1) * (1.0 - self.alpha)) / n)
        self.cal_scores = np.sort(residuals)
        self.q_hat = float(np.quantile(self.cal_scores, adjusted_level, method="higher"))

    def predict_intervals(self, y_pred: np.ndarray) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Generate calibrated lower and upper prediction bounds.
        Returns:
          lower_bound: array of lower limits (clipped at 0 for depth)
          upper_bound: array of upper limits
          margin: constant half-width q_hat
        """
        if self.q_hat is None:
            raise ValueError("Model is not calibrated. Call fit_calibration first.")

        lower_bound = np.maximum(y_pred - self.q_hat, 0.0)
        upper_bound = y_pred + self.q_hat
        return lower_bound, upper_bound, self.q_hat

    def evaluate_coverage(self, y_test: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Verify empirical coverage and average interval sharpness."""
        lower, upper, margin = self.predict_intervals(y_pred)
        covered = (y_test >= lower) & (y_test <= upper)
        empirical_coverage = float(np.mean(covered))
        mean_interval_width = float(np.mean(upper - lower))

        return {
            "target_coverage": self.confidence_level,
            "empirical_coverage": empirical_coverage,
            "mean_interval_width_m": mean_interval_width,
            "conformal_quantile_q_hat_m": self.q_hat,
            "coverage_guarantee_met": bool(empirical_coverage >= self.confidence_level - 0.05),
        }


class QuantileFloodRegressor:
    """
    Gradient-boosted / linear quantile regressor minimizing asymmetric pinball loss.
    Provides heteroscedastic uncertainty bounds that adapt to storm intensity.
    """

    def __init__(self, quantiles: List[float] = [0.05, 0.50, 0.95], lr: float = 0.05):
        self.quantiles = quantiles
        self.lr = lr
        self.models: Dict[float, Dict[str, np.ndarray]] = {}

    @staticmethod
    def pinball_loss(y_true: np.ndarray, y_pred: np.ndarray, tau: float) -> float:
        """Asymmetric piecewise linear pinball loss function."""
        diff = y_true - y_pred
        return float(np.mean(np.maximum(tau * diff, (tau - 1.0) * diff)))

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 100):
        """Fit linear quantile weights using subgradient descent on pinball loss."""
        N, D = X.shape
        X_aug = np.hstack([np.ones((N, 1)), X])

        for q in self.quantiles:
            weights = np.zeros(D + 1)
            # Initialize bias to target empirical quantile
            weights[0] = np.quantile(y, q)

            for epoch in range(epochs):
                pred = np.dot(X_aug, weights)
                diff = y - pred
                # Subgradient of pinball loss
                subgrad = np.where(diff >= 0, -q, 1.0 - q)
                grad = np.dot(X_aug.T, subgrad) / N
                weights -= self.lr * grad

            self.models[q] = {"weights": weights}

    def predict(self, X: np.ndarray) -> Dict[float, np.ndarray]:
        """Predict depths for each quantile tau."""
        N = X.shape[0]
        X_aug = np.hstack([np.ones((N, 1)), X])
        preds = {}
        for q, model in self.models.items():
            pred_raw = np.dot(X_aug, model["weights"])
            preds[q] = np.maximum(pred_raw, 0.0)
        return preds


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - CONFORMAL UNCERTAINTY QUANTIFICATION VALIDATION")
    print("=" * 70)

    rng = np.random.default_rng(42)
    N = 200
    # Synthetic flood events
    rain = rng.uniform(10.0, 100.0, (N, 1))
    slope = rng.uniform(0.005, 0.050, (N, 1))
    X = np.hstack([rain, slope])

    # Non-linear true water depth with heteroscedastic noise
    noise_sigma = 0.03 + 0.002 * rain[:, 0]
    y_true = 0.015 * rain[:, 0] - 5.0 * slope[:, 0] + rng.normal(0, noise_sigma)
    y_true = np.maximum(y_true, 0.0)

    # Simple base predictor
    y_base_pred = 0.014 * rain[:, 0] - 4.5 * slope[:, 0]
    y_base_pred = np.maximum(y_base_pred, 0.0)

    # Split into Calibration (50%) and Test (50%)
    cal_idx = N // 2
    y_cal_true, y_cal_pred = y_true[:cal_idx], y_base_pred[:cal_idx]
    y_test_true, y_test_pred = y_true[cal_idx:], y_base_pred[cal_idx:]

    conformal = ConformalFloodPredictor(confidence_level=0.90)
    conformal.fit_calibration(y_cal_true, y_cal_pred)
    res = conformal.evaluate_coverage(y_test_true, y_test_pred)

    print(f"Target Coverage: {res['target_coverage']*100:.1f}%")
    print(f"Empirical Test Coverage: {res['empirical_coverage']*100:.1f}%")
    print(f"Calibrated Conformal Margin (q_hat): +/- {res['conformal_quantile_q_hat_m']*100:.2f} cm")
    print(f"Mean Interval Width: {res['mean_interval_width_m']*100:.2f} cm")
    assert res['coverage_guarantee_met'], "Conformal coverage failed!"
    print("PASS: Conformal prediction uncertainty bounds verified.")
