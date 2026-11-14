import { TechnologyPillar } from "../types";

export const TECHNOLOGY_PILLARS: TechnologyPillar[] = [
  {
    id: "shallow-water-equations",
    num: "01",
    title: "2D Shallow Water Equations (SWE)",
    tagline: "High-Fidelity Saint-Venant Conservation Laws as Ground-Truth Anchor",
    primaryEquation:
      "∂h/∂t + ∂(hu)/∂x + ∂(hv)/∂y = R(x,y,t) - I(x,y,t)",
    equationDescription:
      "Non-linear hyperbolic partial differential equations governing depth-averaged incompressible fluid flow over complex urban bathymetry.",
    breakdown: [
      {
        term: "h(x, y, t)",
        meaning: "Water surface column depth (meters) above local digital elevation topography.",
      },
      {
        term: "u, v",
        meaning: "Depth-averaged horizontal flow velocities in x and y coordinates (m/s).",
      },
      {
        term: "R - I",
        meaning: "Effective meteorological precipitation forcing rate minus soil infiltration abstraction.",
      },
      {
        term: "Sf (Manning)",
        meaning: "Bed friction slope governed by n² · |u|u / h^(4/3) reflecting urban asphalt vs green canopy.",
      },
    ],
    coreAdvantages: [
      "Rigorous physics: strictly enforces conservation of fluid mass and horizontal momentum",
      "Explicit culvert choke-points, curb weir overflow, and building footprint boundary obstacles",
      "Supplies dense high-fidelity synthetic ground truth ensembles for neural operator pre-training",
    ],
    academicContext:
      "Formulated via depth-integration of the 3D Navier-Stokes equations under hydrostatic pressure assumptions. Classically solved via GPU-accelerated Godunov-type finite volume schemes.",
  },
  {
    id: "neural-operators",
    num: "02",
    title: "Fourier & Physics-Informed Neural Operators",
    tagline: "Sub-Second Mesh-Independent Surrogate Solving with PINO Regularization",
    primaryEquation:
      "vt+1(x) = σ( W · vt(x) + F⁻¹( R · F(vt) )(x) )",
    equationDescription:
      "Infinite-dimensional operator learning parameterized in Fourier frequency space, transforming continuous terrain and rainfall into dynamic flood depth fields.",
    breakdown: [
      {
        term: "F / F⁻¹",
        meaning: "Forward Fast Fourier Transform (FFT) and inverse FFT computing global spatial convolutions in O(N log N).",
      },
      {
        term: "R (Weights)",
        meaning: "Learnable tensor weights truncated at upper wave numbers, acting as continuous differential filters.",
      },
      {
        term: "Zero-Shot Mesh",
        meaning: "Resolution-invariant operator: trains on 10m grid, zero-shot infers directly on 0.5m LiDAR topography.",
      },
      {
        term: "LPINO Loss",
        meaning: "Dual-objective loss: L_data + λ_mass · ‖Res_mass(u)‖² + λ_mom · ‖Res_mom(u)‖² preventing hallucinated water.",
      },
    ],
    coreAdvantages: [
      "Millisecond inference: evaluates 4-hour forward flood propagation in under 45 milliseconds",
      "No numerical CFL stability time-step restrictions during severe convective rainfall spikes",
      "Physics loss penalizes artificial mass generation, ensuring physically compliant inundation depths",
    ],
    academicContext:
      "Extends the Fourier Neural Operator architecture (Li et al., 2020) with Physics-Informed Neural Operator loss terms (Wang et al., 2021) for partial differential equation forward surrogates.",
  },
  {
    id: "sensor-validation",
    num: "03",
    title: "In-Situ Sensor Ingestion & State Assimilation",
    tagline: "Real-Time Ultrasonic Water-Level Telemetry for Closed-Loop Drift Correction",
    primaryEquation:
      "x̂k = x̄k + Kk · ( yk - H · x̄k )",
    equationDescription:
      "Ensemble Kalman Filtering (EnKF) assimilating sparse physical acoustic measurements to continuously correct surrogate model states and boundary conditions.",
    breakdown: [
      {
        term: "yk",
        meaning: "Observed physical water depth transmitted via LoRaWAN/Cellular from field ESP32 ultrasonic nodes.",
      },
      {
        term: "x̄k",
        meaning: "Neural surrogate prior predicted inundation depth and velocity states at time step k.",
      },
      {
        term: "Kk (Gain)",
        meaning: "Optimal Kalman gain weighting sensor measurement noise variance against surrogate model covariance.",
      },
      {
        term: "Closed-Loop",
        meaning: "Real-time error residual dynamically adjusts catchment Manning roughness and upstream inflow rates.",
      },
    ],
    coreAdvantages: [
      "Ground-truthed confidence: eliminates accumulated model drift over multi-hour storm sequences",
      "Automated sensor anomaly rejection (filtering out debris reflections and acoustic wave echo noise)",
      "Autonomous hardware self-calibration against known culvert invert datum elevations",
    ],
    academicContext:
      "Combines distributed edge IoT water-level sensing with sequential data assimilation methods commonly utilized in numerical weather prediction and physical oceanography.",
  },
];
