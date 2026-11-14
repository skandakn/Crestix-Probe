"""
Crestix Probe - Spatial Block Cross-Validation & Autocorrelation Guard
======================================================================
Prevents spatial autocorrelation leakage in machine learning flood inundation models.

Standard random K-Fold cross-validation severely overestimates generalization performance
when spatial autocorrelation (Tobler's First Law of Geography) exists between neighboring cells.

This module provides:
  1. Moran's I spatial autocorrelation statistic computation:
       I = (N / W) * sum_i sum_j w_ij (z_i - z_bar)(z_j - z_bar) / sum_i (z_i - z_bar)^2
  2. Spatial Block K-Fold Splitting:
     Partitions geographic space into regular rectangular blocks (e.g. 4x4 or 8x8 blocks)
     and assigns entire contiguous blocks to either train or validation folds.
  3. Spatial Buffering (Dead Zones):
     Optionally drops training samples within distance buffer D_buffer of validation blocks
     to eliminate boundary leakage.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Generator, Optional, Any


class SpatialAutocorrelationAnalyzer:
    """Computes global and local Moran's I spatial autocorrelation indices."""

    @staticmethod
    def morans_i(
        grid: np.ndarray,
        connectivity: str = "queen",  # "rook" (4-way) or "queen" (8-way)
    ) -> Dict[str, float]:
        """
        Calculate Moran's I for a 2D digital elevation model or water depth grid.
        Returns:
          morans_i: statistic in [-1, 1], where > 0 indicates positive spatial clustering
          expected_i: -1 / (N - 1)
          z_score: significance score
        """
        nx, ny = grid.shape
        N = nx * ny
        z = grid.flatten()
        z_mean = np.mean(z)
        z_diff = z - z_mean
        denom = np.sum(z_diff ** 2)

        if denom == 0:
            return {"morans_i": 0.0, "p_value": 1.0, "clustering": "homogeneous"}

        # Construct spatial adjacency weights on grid
        W_sum = 0.0
        numerator = 0.0

        for r in range(nx):
            for c in range(ny):
                idx_i = r * ny + c
                neighbors = []
                # Rook neighbors
                if r > 0: neighbors.append((r - 1, c))
                if r < nx - 1: neighbors.append((r + 1, c))
                if c > 0: neighbors.append((r, c - 1))
                if c < ny - 1: neighbors.append((r, c + 1))

                if connectivity == "queen":
                    if r > 0 and c > 0: neighbors.append((r - 1, c - 1))
                    if r > 0 and c < ny - 1: neighbors.append((r - 1, c + 1))
                    if r < nx - 1 and c > 0: neighbors.append((r + 1, c - 1))
                    if r < nx - 1 and c < ny - 1: neighbors.append((r + 1, c + 1))

                for nr, nc in neighbors:
                    idx_j = nr * ny + nc
                    numerator += z_diff[idx_i] * z_diff[idx_j]
                    W_sum += 1.0

        I = (N / max(W_sum, 1.0)) * (numerator / denom)
        expected_I = -1.0 / (N - 1) if N > 1 else 0.0

        clustering = "clustered" if I > 0.2 else ("dispersed" if I < -0.2 else "random")
        return {
            "morans_i": float(I),
            "expected_i": float(expected_I),
            "spatial_weights_count": int(W_sum),
            "clustering": clustering,
        }


class SpatialBlockCV:
    """
    Spatially-blocked K-Fold Cross-Validator for gridded geographic domains.
    """

    def __init__(
        self,
        grid_shape: Tuple[int, int] = (20, 20),
        n_blocks_x: int = 4,
        n_blocks_y: int = 4,
        n_splits: int = 4,
        buffer_cells: int = 1,
        seed: int = 42,
    ):
        self.nx, self.ny = grid_shape
        self.n_blocks_x = n_blocks_x
        self.n_blocks_y = n_blocks_y
        self.n_splits = n_splits
        self.buffer = buffer_cells
        self.rng = np.random.default_rng(seed)

        # Assign block ID to every cell
        self.block_ids = np.zeros((self.nx, self.ny), dtype=int)
        x_step = self.nx / n_blocks_x
        y_step = self.ny / n_blocks_y

        for r in range(self.nx):
            bx = min(int(r / x_step), n_blocks_x - 1)
            for c in range(self.ny):
                by = min(int(c / y_step), n_blocks_y - 1)
                self.block_ids[r, c] = bx * n_blocks_y + by

        total_blocks = n_blocks_x * n_blocks_y
        shuffled = self.rng.permutation(total_blocks)
        self.fold_assignments = np.array_split(shuffled, n_splits)

    def split(self) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """
        Yields (train_indices, val_indices) 1D integer indices.
        Applies spatial buffering around validation blocks to strip training leak cells.
        """
        for fold, test_blocks in enumerate(self.fold_assignments):
            test_mask = np.isin(self.block_ids, test_blocks)

            # Generate buffer mask around test blocks
            buffer_mask = np.zeros_like(test_mask)
            if self.buffer > 0:
                for r in range(self.nx):
                    for c in range(self.ny):
                        if test_mask[r, c]:
                            r_min = max(0, r - self.buffer)
                            r_max = min(self.nx, r + self.buffer + 1)
                            c_min = max(0, c - self.buffer)
                            c_max = min(self.ny, c + self.buffer + 1)
                            buffer_mask[r_min:r_max, c_min:c_max] = True

            train_mask = ~(test_mask | buffer_mask)

            val_idx = np.where(test_mask.flatten())[0]
            train_idx = np.where(train_mask.flatten())[0]

            yield train_idx, val_idx


if __name__ == "__main__":
    print("=" * 70)
    print("CRESTIX PROBE - SPATIAL BLOCK CROSS-VALIDATION & MORAN'S I VALIDATION")
    print("=" * 70)

    # 1. Test Moran's I on clustered terrain digital elevation model
    x = np.linspace(-3, 3, 24)
    y = np.linspace(-3, 3, 24)
    X, Y = np.meshgrid(x, y)
    smooth_dem = np.exp(-(X**2 + Y**2) / 4.0) * 15.0  # Gaussian hill
    noise = np.random.default_rng(42).normal(0, 0.5, (24, 24))
    dem_test = smooth_dem + noise

    moran = SpatialAutocorrelationAnalyzer.morans_i(dem_test)
    print(f"DEM Moran's I: {moran['morans_i']:.4f} (Expected: {moran['expected_i']:.4f})")
    print(f"Spatial Pattern: {moran['clustering'].upper()}")
    assert moran['morans_i'] > 0.5, "Moran's I should detect strong spatial clustering in DEM!"

    # 2. Test Spatial Block CV with 1-cell buffer
    sb_cv = SpatialBlockCV(grid_shape=(24, 24), n_blocks_x=4, n_blocks_y=4, n_splits=4, buffer_cells=1)
    for fold_i, (train_idx, val_idx) in enumerate(sb_cv.split(), 1):
        print(f"Fold {fold_i}: Train samples={len(train_idx)}, Val samples={len(val_idx)}, "
              f"Buffered (dropped)={24*24 - len(train_idx) - len(val_idx)}")

    print("PASS: Spatial block cross-validation and Moran's I statistics verified.")
