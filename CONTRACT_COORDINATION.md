# CONTRACT COORDINATION: MEMBER 5 & MEMBER 9
## CRESTIX PROBE — Hydraulic Simulation Interface Contract

This document outlines the coordinated REST API and WebSocket/JSON data contracts between **Member 5** (Flood Simulation Frontend Workspace) and **Member 9** (Backend Simulation Engine & Numerical Shallow-Water Solver).

---

### 1. SI Standard Units
All simulation parameters and numerical matrices exchanged must adhere to standard SI units:
- **Spatial Resolution & Dimensions**: Meters ($m$)
- **Elevation Grid (DEM)**: Meters above datum ($m$)
- **Water Depth**: Meters of fluid column ($m$)
- **Rainfall Intensity**: Millimeters per hour ($mm/h$)
- **Simulation Time & Step**: Seconds ($s$) or Minutes ($min$) as labelled
- **Surface Roughness**: Manning's roughness coefficient $n$ ($s \cdot m^{-1/3}$)
- **Volumetric Discharge / Storage**: Cubic meters ($m^3$) or $m^3/s$

---

### 2. Endpoints Specification

#### 2.1 POST `/api/simulation/run`
Submits a flood simulation run request.

**Request Payload (`SimulationRunRequest`):**
```json
{
  "terrainId": "urban-basin",
  "gridDimensions": {
    "rows": 20,
    "cols": 20,
    "cellSizeMeters": 10.0
  },
  "elevationGrid": [
    [10.2, 10.1, 9.8],
    [9.9, 8.5, 9.4]
  ],
  "rainfall": {
    "intensityMmPerHour": 65.0,
    "durationMinutes": 60
  },
  "initialWaterDepthMeters": 0.0,
  "surfaceRoughnessManning": 0.035,
  "boundaryConditions": {
    "north": "closed",
    "south": "open",
    "east": "closed",
    "west": "closed"
  },
  "timeStepSeconds": 30,
  "totalDurationMinutes": 120
}
```

**Response Payload (`SimulationRunResponse`):**
```json
{
  "simulationId": "sim-20261114-x829a",
  "status": "completed",
  "createdAt": "2026-11-14T08:00:00.000Z",
  "totalSteps": 240,
  "estimatedDurationSeconds": 1.5,
  "message": "Simulation initialized."
}
```

---

#### 2.2 GET `/api/simulation/{id}`
Returns job status, step count, and execution progress.

**Response Payload (`SimulationStatusResponse`):**
```json
{
  "simulationId": "sim-20261114-x829a",
  "status": "completed",
  "progressPercentage": 100,
  "currentStep": 240,
  "totalSteps": 240,
  "executionTimeMs": 1420,
  "createdAt": "2026-11-14T08:00:00.000Z",
  "completedAt": "2026-11-14T08:00:02.000Z",
  "config": { ... }
}
```

---

#### 2.3 GET `/api/simulation/{id}/frames`
Fetches the full 2D water-depth matrix sequence for time-step animation.

**Response Payload (`SimulationFramesResponse`):**
```json
{
  "simulationId": "sim-20261114-x829a",
  "rows": 20,
  "cols": 20,
  "cellSizeMeters": 10.0,
  "elevationGrid": [[...]],
  "totalFrames": 240,
  "timeStepSeconds": 30,
  "frames": [
    {
      "step": 0,
      "timeSeconds": 0,
      "waterDepthGrid": [[0.0, 0.0, 0.0]],
      "maxDepthMeters": 0.0,
      "avgDepthMeters": 0.0,
      "floodedCellCount": 0,
      "totalWaterVolumeM3": 0
    },
    {
      "step": 1,
      "timeSeconds": 30,
      "waterDepthGrid": [[0.02, 0.05, 0.01]],
      "maxDepthMeters": 0.05,
      "avgDepthMeters": 0.018,
      "floodedCellCount": 38,
      "totalWaterVolumeM3": 72
    }
  ]
}
```

---

### 3. Boundary Conditions Protocol
Supported boundary string literals:
- `"closed"`: Solid reflective boundary ($\vec{v} \cdot \hat{n} = 0$, $\partial h / \partial n = 0$).
- `"open"`: Absorbing / free outflow boundary (Sommerfeld radiation / critical outflow).
- `"weir"`: Broad-crested weir spillway discharge above specified elevation barrier ($0.25\text{m}$).
- `"inflow"`: Hydrograph flux injection boundary condition.

---

### 4. Deterministic Mock vs Real Physics Separation
- The frontend includes `MockSimulationApiAdapter`, clearly marked as a deterministic mock demonstration adapter for UI verification and data contract compatibility testing.
- The numerical shallow-water solver (Saint-Venant equations) resides exclusively in Member 9's backend workstream.
