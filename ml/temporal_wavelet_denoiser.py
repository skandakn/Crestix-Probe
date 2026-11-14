"""
Crestix Probe - Discrete Wavelet Transform (DWT) Signal Denoising Engine
========================================================================
Applies multi-scale Discrete Wavelet Decomposition (Haar / Daubechies db2) for filtering
in-situ ultrasonic water level time-series (from IoT probes like river_sensor_alpha).

Hydrodynamic Signal Decomposition:
  Raw Acoustic Signal x(t) = s(t) + n(t)
  - s(t): True bulk hydraulic water stage rise/fall
  - n(t): High-frequency turbulent ripple chop, surface foam attenuation, and acoustic echoes

Wavelet Filter Stages:
  1. Forward DWT: Decomposes signal into Approximation (low-pass A_j) and Detail (high-pass D_j)
  2. Donoho-Johnstone Universal Thresholding:
       lambda_threshold = sigma_noise * sqrt(2 * ln(N))
       where sigma_noise = Median(|D_1|) / 0.6745
  3. Soft Wavelet Shrinkage:
       sign(d) * max(|d| - lambda, 0)
  4. Inverse DWT: Exact reconstruction of clean, lag-free hydraulic hydrograph
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class WaveletDenoisingFilter:
    """Multi-level discrete wavelet denoiser with VisuShrink soft thresholding."""

    # Daubechies-2 (db2) 4-tap filter coefficients
    H_LP = np.array([
        (1.0 + math.sqrt(3.0)) / (4.0 * math.sqrt(2.0)),
        (3.0 + math.sqrt(3.0)) / (4.0 * math.sqrt(2.0)),
        (3.0 - math.sqrt(3.0)) / (4.0 * math.sqrt(2.0)),
        (1.0 - math.sqrt(3.0)) / (4.0 * math.sqrt(2.0)),
    ])
    H_HP = np.array([
        H_LP[3],
        -H_LP[2],
        H_LP[1],
        -H_LP[0],
    ])

    def __init__(self, decomposition_level: int = 3, threshold_rule: str = "soft"):
        self.level = decomposition_level
        self.rule = threshold_rule

    def dwt_step(self, signal: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Single-level forward DWT with periodic extension."""
        N = len(signal)
        # Circular convolution and downsample by 2
        approx = []
        detail = []
        for i in range(0, N, 2):
            idx = [(i + k) % N for k in range(len(self.H_LP))]
            approx.append(float(np.sum(signal[idx] * self.H_LP)))
            detail.append(float(np.sum(signal[idx] * self.H_HP)))

        return np.array(approx), np.array(detail)

    def idwt_step(self, approx: np.ndarray, detail: np.ndarray) -> np.ndarray:
        """Single-level inverse DWT with upsampling and synthesis filtering."""
        M = len(approx)
        N = 2 * M
        reconstructed = np.zeros(N)

        for i in range(M):
            for k in range(len(self.H_LP)):
                out_idx = (2 * i + k) % N
                reconstructed[out_idx] += approx[i] * self.H_LP[k] + detail[i] * self.H_HP[k]

        return reconstructed

    def decompose(self, signal: np.ndarray) -> List[np.ndarray]:
        """Multi-level wavelet decomposition."""
        curr_approx = signal.copy()
        coeffs = []

        for _ in range(self.level):
            if len(curr_approx) < 8:
                break
            curr_approx, detail = self.dwt_step(curr_approx)
            coeffs.append(detail)

        coeffs.append(curr_approx)
        return coeffs  # [Detail_1, Detail_2, ..., Approx_final]

    def denoise_signal(self, noisy_signal: np.ndarray) -> Dict[str, Any]:
        """
        Execute full Donoho-Johnstone wavelet shrinkage denoising pipeline.
        """
        N = len(noisy_signal)
        # Pad to next power of 2
        target_len = 1 << (N - 1).bit_length()
        if target_len < 16:
            target_len = 16
        padded = np.pad(noisy_signal, (0, target_len - N), mode="edge")

        coeffs = self.decompose(padded)
        details = coeffs[:-1]
        final_approx = coeffs[-1]

        # 1. Estimate noise standard deviation from finest detail scale D1
        d1 = details[0]
        sigma_noise = float(np.median(np.abs(d1)) / 0.6745) if len(d1) > 0 else 1.0

        # 2. Universal VisuShrink threshold
        threshold = sigma_noise * math.sqrt(2.0 * math.log(max(target_len, 2)))

        # 3. Soft threshold detail coefficients
        thresholded_details = []
        for d in details:
            if self.rule == "soft":
                d_thresh = np.sign(d) * np.maximum(np.abs(d) - threshold, 0.0)
            else:
                d_thresh = np.where(np.abs(d) >= threshold, d, 0.0)
            thresholded_details.append(d_thresh)

        # 4. Inverse DWT reconstruction
        curr_approx = final_approx
        for d in reversed(thresholded_details):
            curr_approx = self.idwt_step(curr_approx, d)

        clean_signal = curr_approx[:N]
        snr_improvement_db = 10.0 * math.log10(
            np.var(noisy_signal) / max(np.var(noisy_signal - clean_signal), 1e-6)
        )

        return {
            "clean_signal": clean_signal.tolist(),
            "noise_std_estimated_cm": round(sigma_noise, 3),
            "universal_threshold_lambda": round(threshold, 3),
            "snr_improvement_db": round(snr_improvement_db, 2),
            "input_samples": N,
        }


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - DISCRETE WAVELET TRANSFORM (DWT) SIGNAL DENOISER TEST")
    print("=" * 70)

    # 64-sample hydrograph recording
    t = np.linspace(0, 10, 64)
    # True water stage rise
    true_stage = 12.0 + 8.0 * (1.0 / (1.0 + np.exp(-(t - 4.5))))
    # Synthetic turbulence noise and acoustic multipath spikes
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 1.2, 64)
    noise[18] += 7.5  # Echo spike
    noise[42] -= 6.0  # Surface scattering drop
    noisy_stage = true_stage + noise

    denoiser = WaveletDenoisingFilter(decomposition_level=3)
    res = denoiser.denoise_signal(noisy_stage)

    clean = np.array(res["clean_signal"])
    rmse_raw = math.sqrt(np.mean((noisy_stage - true_stage) ** 2))
    rmse_clean = math.sqrt(np.mean((clean - true_stage) ** 2))

    print(f"Raw Signal RMSE:   {rmse_raw:.3f} cm")
    print(f"Clean Signal RMSE: {rmse_clean:.3f} cm (Denoised Error Reduction: {(1.0 - rmse_clean/rmse_raw)*100:.1f}%)")
    print(f"Estimated Noise Sigma: {res['noise_std_estimated_cm']:.3f} cm | Universal Threshold: {res['universal_threshold_lambda']:.3f}")
    print(f"SNR Improvement:   +{res['snr_improvement_db']} dB")

    assert rmse_clean < rmse_raw
    print("\nPASS: DWT wavelet signal denoiser successfully filtered ultrasonic telemetry.")
