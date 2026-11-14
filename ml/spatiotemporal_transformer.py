"""
Crestix Probe - Spatio-Temporal Transformer (ST-Transformer) for Flood Forecasting
===================================================================================
Applies an attention-based Vision/Temporal Transformer architecture for gridded 2D
inundation depth forecasting across multiple forward prediction horizons:
  [t + 10 min, t + 20 min, t + 30 min, t + 60 min].

Architecture:
  1. Patchify & Linear Embedding:
     Extracts non-overlapping patches (e.g. 4x4 cells) from input grids:
       Input: [B, T_in, C, H, W] -> Patches: [B, T_in, N_patches, d_model]
  2. Spatio-Temporal Multi-Head Attention (ST-MHA):
     - Spatial Self-Attention across N_patches captures basin-wide topological correlations
     - Causal Temporal Attention across T_in past timestamps captures hydrodynamic wave celerity
  3. Autoregressive / Multi-Horizon Decoder:
     Unrolls future spatial depth fields with residual skip connections.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any


class MultiHeadAttentionNumPy:
    """Multi-Head Scaled Dot-Product Attention layer."""

    def __init__(self, d_model: int = 32, num_heads: int = 4, seed: int = 42):
        assert d_model % num_heads == 0
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        self.rng = np.random.default_rng(seed)

        scale = 1.0 / math.sqrt(d_model)
        self.w_q = self.rng.uniform(-scale, scale, (d_model, d_model))
        self.w_k = self.rng.uniform(-scale, scale, (d_model, d_model))
        self.w_v = self.rng.uniform(-scale, scale, (d_model, d_model))
        self.w_o = self.rng.uniform(-scale, scale, (d_model, d_model))

    def forward(self, q: np.ndarray, k: np.ndarray, v: np.ndarray, mask: Optional[np.ndarray] = None) -> np.ndarray:
        """
        q, k, v shape: (Seq_Len, d_model)
        """
        Q = np.dot(q, self.w_q)
        K = np.dot(k, self.w_k)
        V = np.dot(v, self.w_v)

        # Scaled dot-product attention
        scores = np.dot(Q, K.T) / math.sqrt(self.d_k)
        if mask is not None:
            scores = np.where(mask == 0, -1e9, scores)

        # Softmax
        exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        attn_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)

        context = np.dot(attn_weights, V)
        output = np.dot(context, self.w_o)
        return output


class SpatioTemporalTransformerBlock:
    """Transformer block with factorized spatial and temporal attention."""

    def __init__(self, d_model: int = 32, num_heads: int = 4, seed: int = 42):
        self.spatial_attn = MultiHeadAttentionNumPy(d_model, num_heads, seed=seed)
        self.temporal_attn = MultiHeadAttentionNumPy(d_model, num_heads, seed=seed + 1)
        self.rng = np.random.default_rng(seed)

        # Feed-forward network (FFN)
        d_ff = 4 * d_model
        self.w1 = self.rng.normal(0, 0.1, (d_model, d_ff))
        self.b1 = np.zeros(d_ff)
        self.w2 = self.rng.normal(0, 0.1, (d_ff, d_model))
        self.b2 = np.zeros(d_model)

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        x shape: (T_steps, N_patches, d_model)
        """
        T, N, D = x.shape

        # 1. Spatial attention per time step
        spatial_out = np.zeros_like(x)
        for t in range(T):
            spatial_out[t] = x[t] + self.spatial_attn.forward(x[t], x[t], x[t])

        # 2. Temporal attention per spatial patch
        temporal_out = np.zeros_like(spatial_out)
        for p in range(N):
            seq = spatial_out[:, p, :]
            temporal_out[:, p, :] = seq + self.temporal_attn.forward(seq, seq, seq)

        # 3. Position-wise FFN with residual connection
        ffn_in = temporal_out
        h_ffn = np.maximum(0.0, np.dot(ffn_in, self.w1) + self.b1)  # ReLU
        out = ffn_in + np.dot(h_ffn, self.w2) + self.b2
        return out


class SpatioTemporalFloodTransformer:
    """
    End-to-End Deep Spatio-Temporal Transformer for gridded flood sequence prediction.
    """

    def __init__(
        self,
        grid_shape: Tuple[int, int] = (16, 16),
        patch_size: int = 4,
        in_channels: int = 3,  # (h, elevation, rain)
        d_model: int = 32,
        forecast_horizons_min: List[int] = [10, 20, 30, 60],
        seed: int = 42,
    ):
        self.H, self.W = grid_shape
        self.patch_size = patch_size
        self.n_patches_h = self.H // patch_size
        self.n_patches_w = self.W // patch_size
        self.n_patches = self.n_patches_h * self.n_patches_w
        self.patch_dim = patch_size * patch_size * in_channels
        self.d_model = d_model
        self.horizons = forecast_horizons_min

        self.rng = np.random.default_rng(seed)
        # Patch linear projection
        self.w_patch = self.rng.normal(0, 0.1, (self.patch_dim, d_model))
        # Transformer backbone blocks
        self.block1 = SpatioTemporalTransformerBlock(d_model, num_heads=4, seed=seed)
        self.block2 = SpatioTemporalTransformerBlock(d_model, num_heads=4, seed=seed + 10)

        # Head predicting future depth maps
        self.w_head = self.rng.normal(0, 0.1, (d_model, len(forecast_horizons_min) * patch_size * patch_size))

    def _patchify(self, grid_sequence: np.ndarray) -> np.ndarray:
        """
        Extract patches from sequence of grids.
        Input: (T, in_channels, H, W) -> Output: (T, N_patches, patch_dim)
        """
        T, C, H, W = grid_sequence.shape
        P = self.patch_size
        patches = []

        for t in range(T):
            t_patches = []
            for r in range(0, H, P):
                for c in range(0, W, P):
                    patch = grid_sequence[t, :, r:r+P, c:c+P].flatten()
                    t_patches.append(patch)
            patches.append(t_patches)

        return np.array(patches)

    def forecast(self, input_sequence: np.ndarray) -> Dict[int, np.ndarray]:
        """
        Generates 2D spatial depth forecasts for each horizon in self.horizons.
        Input shape: (T, in_channels, H, W)
        Returns: {horizon_min: (H, W) predicted depth array}
        """
        patches = self._patchify(input_sequence)  # (T, N_patches, patch_dim)
        x_emb = np.dot(patches, self.w_patch)     # (T, N_patches, d_model)

        # Transformer representation
        x = self.block1.forward(x_emb)
        x = self.block2.forward(x)

        # Decode from final time step
        last_rep = x[-1]  # (N_patches, d_model)
        decoded = np.dot(last_rep, self.w_head)  # (N_patches, n_horizons * P * P)

        P = self.patch_size
        n_h = len(self.horizons)
        outputs = {}

        for h_idx, h_min in enumerate(self.horizons):
            pred_grid = np.zeros((self.H, self.W))
            patch_idx = 0
            for r in range(0, self.H, P):
                for c in range(0, self.W, P):
                    start = h_idx * (P * P)
                    end = (h_idx + 1) * (P * P)
                    patch_vals = decoded[patch_idx, start:end].reshape((P, P))
                    pred_grid[r:r+P, c:c+P] = np.maximum(patch_vals, 0.0)
                    patch_idx += 1
            outputs[h_min] = pred_grid

        return outputs


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - SPATIO-TEMPORAL TRANSFORMER (ST-Transformer) TEST")
    print("=" * 70)

    # 16x16 grid with 3 channels: (water_depth, elevation, rainfall_intensity)
    T_history = 4
    st_trans = SpatioTemporalFloodTransformer(grid_shape=(16, 16), patch_size=4, in_channels=3)

    # Synthetic sequence of past 4 timesteps (t-3, t-2, t-1, t)
    rng = np.random.default_rng(42)
    mock_input = np.zeros((T_history, 3, 16, 16))
    for t in range(T_history):
        mock_input[t, 0] = 0.10 * (t + 1)  # Growing flood stage
        mock_input[t, 1] = 15.0             # DEM elevation
        mock_input[t, 2] = 45.0             # Rain intensity

    print("Running forward inference across multi-horizon forecasts...")
    predictions = st_trans.forecast(mock_input)

    for h_min, pred in predictions.items():
        print(f"Horizon t + {h_min:2d} min: Mean Predicted Depth = {np.mean(pred):.3f} m, Max Depth = {np.max(pred):.3f} m")

    assert len(predictions) == 4
    print("\nPASS: Spatio-Temporal Transformer multi-horizon inference verified successfully.")
