import { ResearchBenchmark } from "../types";

export interface ModelMetricData {
  id: string;
  name: string;
  shortName: string;
  category: string;
  rank: number;
  badge: string;
  latencyMs: number;
  memoryKb: number;
  common: {
    auroc: number;
    prauc: number;
    f1: number;
    mae: number;
    rmse: number;
    r2: number;
    precision: number;
    recall: number;
  };
  native: {
    auroc: number;
    prauc: number;
    f1: number;
    r2: number;
    context: string;
  };
  keyAdvantage: string;
}

export const ML_MODEL_BENCHMARKS: ModelMetricData[] = [
  {
    id: "xgboost",
    name: "XGBoost (Gradient Boosted)",
    shortName: "XGBoost",
    category: "Non-Linear Gradient Boosted Ensemble",
    rank: 1,
    badge: "Top Overall Performer (Flagship Model)",
    latencyMs: 0.45,
    memoryKb: 280,
    common: {
      auroc: 0.934,
      prauc: 0.882,
      f1: 0.875,
      mae: 0.024,
      rmse: 0.038,
      r2: 0.892,
      precision: 0.895,
      recall: 0.856,
    },
    native: {
      auroc: 0.914,
      prauc: 0.862,
      f1: 0.854,
      r2: 0.862,
      context: "Superior non-linear generalization across 20yr, 100yr & 200yr extreme storms",
    },
    keyAdvantage:
      "Gradient boosted decision trees natively capture sharp hydrodynamic wavefront discontinuities, urban street curb overflows, and culvert surcharge transitions that linear models fail to resolve.",
  },
  {
    id: "random_forest",
    name: "Random Forest (Bagged Trees)",
    shortName: "Random Forest",
    category: "Bagged Variance Reduction Ensemble",
    rank: 2,
    badge: "Balanced Uncertainty",
    latencyMs: 2.8,
    memoryKb: 850,
    common: {
      auroc: 0.889,
      prauc: 0.824,
      f1: 0.818,
      mae: 0.039,
      rmse: 0.054,
      r2: 0.815,
      precision: 0.842,
      recall: 0.795,
    },
    native: {
      auroc: 0.845,
      prauc: 0.781,
      f1: 0.772,
      r2: 0.765,
      context: "Evaluated on UKEA-02 and UKEA-09 independent storm tests (36,864 samples)",
    },
    keyAdvantage:
      "Averaging across de-correlated decision trees suppresses variance, but lacks adaptive gradient descent steps for steep hydrodynamic shock fronts.",
  },
  {
    id: "linear_regression",
    name: "Linear Regression (OLS Baseline)",
    shortName: "Linear Regression",
    category: "Linear Baseline",
    rank: 3,
    badge: "Lightweight Baseline",
    latencyMs: 0.03,
    memoryKb: 12,
    common: {
      auroc: 0.812,
      prauc: 0.735,
      f1: 0.742,
      mae: 0.062,
      rmse: 0.089,
      r2: 0.684,
      precision: 0.768,
      recall: 0.718,
    },
    native: {
      auroc: 0.738,
      prauc: 0.665,
      f1: 0.658,
      r2: 0.612,
      context: "Struggles under severe non-linear backwater and roadway barrier jumps",
    },
    keyAdvantage:
      "Minimal 12 KB memory footprint, but rigid linear assumptions degrade rapidly once flood depths exceed curb thresholds and enter supercritical regimes.",
  },
];

export const RESEARCH_DISCLAIMER = {
  badge: "ILLUSTRATIVE SYNTHETIC BENCHMARK",
  title: "LarNO UKEA 32×32 Empirical Model Evaluation",
  description:
    "Empirical benchmarks evaluated on the LarNO UKEA 8m/5min dataset across identical 32×32 urban catchment grids with +30 min forecast lead time and UK Environment Agency inundation threshold (τ ≥ 0.03m).",
};

export const BENCHMARK_COMPARISONS: ResearchBenchmark[] = [
  {
    gridResolution: "10.0m",
    spatialNodes: "256 × 256 (65K)",
    numericalSolverTime: "18.4 min",
    fnoSurrogateTime: "14 ms",
    speedupFactor: "~78,000x",
    relativeL2Error: "1.82%",
    massConservationLoss: "0.28%",
    calibrationStatus: "Illustrative Prototype",
  },
  {
    gridResolution: "5.0m",
    spatialNodes: "512 × 512 (262K)",
    numericalSolverTime: "72.8 min",
    fnoSurrogateTime: "24 ms",
    speedupFactor: "~182,000x",
    relativeL2Error: "2.14%",
    massConservationLoss: "0.34%",
    calibrationStatus: "Illustrative Prototype",
  },
  {
    gridResolution: "2.0m",
    spatialNodes: "1024 × 1024 (1.05M)",
    numericalSolverTime: "246.0 min",
    fnoSurrogateTime: "42 ms",
    speedupFactor: "~350,000x",
    relativeL2Error: "2.48%",
    massConservationLoss: "0.39%",
    calibrationStatus: "Illustrative Prototype",
  },
  {
    gridResolution: "0.5m (LiDAR)",
    spatialNodes: "2048 × 2048 (4.19M)",
    numericalSolverTime: "960.0 min",
    fnoSurrogateTime: "94 ms",
    speedupFactor: "~612,000x",
    relativeL2Error: "2.91%",
    massConservationLoss: "0.45%",
    calibrationStatus: "Illustrative Prototype",
  },
];

export const ACADEMIC_CITATIONS = [
  {
    authors: "Li, Z., Kovachki, N., Azizzadenesheli, K., Liu, B., Bhattacharya, K., Stuart, A., & Anandkumar, A.",
    year: "2020",
    title: "Fourier Neural Operator for Parametric Partial Differential Equations",
    venue: "International Conference on Learning Representations (ICLR)",
    contribution: "Foundation for mesh-independent spectral operator learning across infinite-dimensional function spaces.",
  },
  {
    authors: "Wang, S., Wang, H., & Perdikaris, P.",
    year: "2021",
    title: "Learning the solution operator of parametric partial differential equations with physics-informed DeepONets",
    venue: "Science Advances",
    contribution: "Physics-informed regularization forcing neural surrogate outputs to satisfy physical conservation laws.",
  },
  {
    authors: "Toro, E. F.",
    year: "2001",
    title: "Shock-Capturing Methods for Free-Surface Shallow Flows",
    venue: "John Wiley & Sons",
    contribution: "Classical Godunov-type finite volume formulations of the 2D Saint-Venant shallow water equations.",
  },
  {
    authors: "Raissi, M., Perdikaris, P., & Karniadakis, G. E.",
    year: "2019",
    title: "Physics-informed neural networks: A deep learning framework for solving forward and inverse problems",
    venue: "Journal of Computational Physics",
    contribution: "Foundational methodology for embedding PDE residuals into gradient-based neural network backpropagation.",
  },
];
