# Data Dictionary — Crestix Probe LarNO Preprocessing Pipeline

This document defines the official data specifications, physical units, tensor shapes, coordinates, and transformation rules for the **LarNO UKEA 8m / 5-minute** flood dataset used by both the **XGBoost** and **PINO (Physics-Informed Neural Operator)** teams.

---

## 1. Dataset Overview

- **Source:** [holmescao/LarNO-dataset on Hugging Face](https://huggingface.co/datasets/holmescao/LarNO-dataset)
- **Reference Paper:** *Large-scale urban flood modeling and zero-shot high-resolution generalization with LarNO* (Journal of Hydrology, 2026)
- **License:** MIT License (Permissive commercial and research redistribution)
- **Catchment Site:** UK Environment Agency (UKEA) Catchment Site (~0.40 km²)
- **Simulation Engine:** MIKE+ Hydrodynamic 2D Overland Flow Solver
- **Full Domain Grid:** 50 rows × 120 columns (6,000 cells at 8.0 m resolution)
- **Official Selected Crop:** 32 rows × 32 columns (1,024 cells, 256 m × 256 m)
- **Temporal Duration:** 36 time steps at 5-minute intervals (180 minutes / 3.0 hours total duration)

---

## 2. Spatial Crop Specification

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Row Slice** | `[12:44]` (32 pixels) | Rows 12 inclusive to 44 exclusive (y-axis) |
| **Column Slice** | `[32:64]` (32 pixels) | Columns 32 inclusive to 64 exclusive (x-axis) |
| **Cell Resolution** | `8.0 m` | Uniform square cell resolution in both dimensions |
| **Physical Width** | `256.0 m` | $32 \times 8.0\text{ m}$ |
| **Physical Height** | `256.0 m` | $32 \times 8.0\text{ m}$ |
| **Physical Area** | `0.065536 km²` | Active catchment sub-basin |
| **Topography Range** | `21.68 m – 31.46 m` | Span of 9.78 m elevation difference |
| **Topography Mean** | `26.68 m ± 1.85 m` | Ground surface elevation distribution |
| **Flooded Area %** | `35.4% – 60.4%` | Wet cell percentage across return periods |
| **Peak Water Depth** | `1.913 m` | Deepest pooling point in the UKEA catchment |

### Crop Selection Rationale
1. **Topographic Realism:** Captures the primary drainage channel and natural confluence basin where runoff from adjacent slopes converges.
2. **Avoidance of Boundary Artifacts:** The full UKEA grid has an artificial boundary wall at row 0 (elevation clamped to 40.0 m) and zero-padded borders. Crop `[12:44, 32:64]` avoids boundary edges completely.
3. **Hydrological Monotonicity:** Across the 4 test return periods (100y, 200y, 300y, 500y), the flooded area within this window increases smoothly from 35.4% to 60.4%, providing clean, physically realistic learning signals for machine learning.
4. **Computational Alignment:** $32 \times 32$ is a power of 2 ($2^5$), directly optimizing 2D Fourier transforms (FFT) in Neural Operators without requiring periodic padding.

---

## 3. Variable Definitions & Formats

### 3.1 Digital Elevation Model (`dem.npy`)
- **Description:** Static topographic bare-earth elevation above sea level.
- **Physical Unit:** Meters ($m$)
- **Array Shape:** `(32, 32)`
- **Data Type:** `float32`
- **Memory Layout:** C-contiguous
- **NaN / Missing Values:** Exactly `0` in UKEA 8m (all cells have valid elevation).
- **Z-Score Normalization:**
  $$\text{dem}_{\text{norm}} = \frac{\text{dem} - 26.684261}{1.847113}$$

### 3.2 Dynamic Rainfall (`rainfall.npy`)
- **Description:** Dynamic precipitation forcing input over time.
- **Physical Unit:** Millimetres per 5-minute interval ($mm / 5\text{min}$)
- **Array Shape:** `(36, 32, 32)` corresponding to time steps $t \in [0, 35]$
- **Temporal Resolution:** 5 minutes per step ($t=0 \to 0\text{ min}, t=35 \to 175\text{ min}$)
- **Data Type:** `float32`
- **Memory Layout:** C-contiguous
- **NaN / Missing Values:** `0`
- **Z-Score Normalization:**
  $$\text{rain}_{\text{norm}} = \frac{\text{rain} - 0.607498}{0.627756}$$

### 3.3 Water Depth Ground Truth (`h.npy`)
- **Description:** 2D overland water depth distribution simulated by the MIKE+ hydrodynamic engine.
- **Physical Unit:**
  - Raw array: Meters ($m$)
  - PINO / Millimetre scaling: Millimetres ($mm$) via $h_{\text{mm}} = h \times 1000.0$
- **Array Shape:** `(36, 32, 32)` corresponding to time steps $t \in [0, 35]$
- **Data Type:** `float32`
- **Memory Layout:** C-contiguous
- **NaN / Missing Values:** `0`
- **Minimum Value:** $\ge 0.0\text{ m}$ (non-negative overland depth)
- **Z-Score Normalization:**
  $$h_{\text{norm}} = \frac{h - 0.126487}{0.223847}$$

---

## 4. Normalization Constants (Training-Set Governed)

All normalization parameters are computed **exclusively** on the 6 training events to strictly prevent data leakage:

```json
{
  "dem": {
    "mean": 26.684261,
    "std": 1.847113,
    "min": 21.684074,
    "max": 31.464674
  },
  "rainfall": {
    "mean": 0.607498,
    "std": 0.627756,
    "min": 0.0,
    "max": 3.551322
  },
  "water_depth": {
    "mean": 0.126487,
    "std": 0.223847,
    "min": 0.0,
    "max": 1.912649
  }
}
```

---

## 5. Shared Data Contracts for Model Teams

### 5.1 XGBoost Team Contract
- **Task:** Spatiotemporal regression to predict water depth at future time step $t + \Delta t$.
- **Format:** Tabular feature matrix ($N \times D$) where each row is a `(pixel, timestep)` instance:
  - **Static Topographic Features:**
    1. `dem_elevation_norm`: Normalized elevation
    2. `dem_slope_gradient`: Computed via Sobel/finite difference $\sqrt{(\partial z/\partial x)^2 + (\partial z/\partial y)^2}$
    3. `dem_curvature`: Laplacian of elevation $\nabla^2 z$
    4. `grid_row_norm`: $r / 31.0 \in [0, 1]$
    5. `grid_col_norm`: $c / 31.0 \in [0, 1]$
  - **Dynamic Meteorological Features:**
    6. `rain_t0_norm`: Rainfall at current time step $t$
    7. `rain_t1_norm`: Lagged rainfall at $t - 1$
    8. `rain_t2_norm`: Lagged rainfall at $t - 2$
    9. `rain_cumsum_norm`: Cumulative rainfall up to time $t$
  - **Autoregressive State Features:**
    10. `water_depth_t0`: Water depth at current time step $t$
    11. `water_depth_tminus1`: Water depth at $t - 1$
  - **Target Variable ($y$):**
    - Direct: $h(t+1)$
    - Delta formulation: $\Delta h = h(t+1) - h(t)$

### 5.2 PINO (Physics-Informed Neural Operator) Team Contract
- **Task:** Continuous spatiotemporal neural operator mapping input functions $(z(x, y), R(x, y, t))$ to state $h(x, y, t)$.
- **Tensor Input:** `(B, C_in, H, W, T)` = `(B, 2, 32, 32, 36)`:
  - Channel 0: Static DEM broadcast across time `(B, 1, 32, 32, 36)`
  - Channel 1: Dynamic rainfall `(B, 1, 32, 32, 36)`
- **Target Tensor:** `(B, 1, 32, 32, 36)` water depth
- **PDE Loss Formulation:** Evaluated using central finite differences on $32 \times 32$ spatial grid with cell size $\Delta x = \Delta y = 8.0\text{ m}$ and $\Delta t = 300\text{ s}$ (5 minutes).

---

## 6. Event Split Summary

| Split | Count | Event Names |
| :--- | :--- | :--- |
| **Train** | 6 | `r100y_p0.1_d3h_1`, `r100y_p0.8_d3h_1`, `r200y_p0.3_d3h_1`, `r300y_p0.1_d3h_1`, `r300y_p0.5_d3h_1`, `r500y_p0.2_d3h_1` |
| **Validation** | 2 | `r100y_p0.5_d3h_1`, `r200y_p0.7_d3h_1` |
| **Test** | 12 | `r100y_p0.6_d3h_1`, `r100y_p0.7_d3h_1`, `r200y_p0.5_d3h_1`, `r300y_p0.4_d3h_1`, `r300y_p0.6_d3h_1`, `r300y_p0.8_d3h_1`, `r300y_p0.9_d3h_1`, `r500y_p0.1_d3h_1`, `r500y_p0.3_d3h_1`, `r500y_p0.4_d3h_1`, `r500y_p0.6_d3h_1`, `r500y_p0.9_d3h_1` |
