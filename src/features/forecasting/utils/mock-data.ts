import {
  ForecastRecord,
  ForecastFrame,
  AIModelId,
  PredictionHorizonHours,
  RolloutErrorPoint,
  ModelComparisonRecord
} from '../types/forecast';
import { AI_MODELS, FORECAST_SCENARIOS, CRITICAL_INFRASTRUCTURE } from './physics';

/**
 * Generates scientifically grounded 2D depth and velocity fields for sample forecasting data.
 * Adheres to 2D shallow water conservation characteristics:
 * Upstream inflow surges through a central river meander and spills across floodplains.
 */
export function generateSyntheticHydrodynamicFrames(
  modelId: AIModelId,
  scenarioId: string,
  horizonHours: PredictionHorizonHours,
  gridSize: number = 64
): ForecastFrame[] {
  const scenario = FORECAST_SCENARIOS.find((s) => s.id === scenarioId) || FORECAST_SCENARIOS[0];
  const stepMinutes = horizonHours <= 6 ? 15 : horizonHours <= 24 ? 30 : 60;
  const totalSteps = Math.floor((horizonHours * 60) / stepMinutes);

  const frames: ForecastFrame[] = [];
  const baseTime = new Date('2026-11-14T06:00:00Z').getTime();

  // River channel geometry parameters
  const midCol = Math.floor(gridSize * 0.45);
  const channelWidth = Math.floor(gridSize * 0.12);

  for (let step = 0; step <= totalSteps; step++) {
    const elapsedMinutes = step * stepMinutes;
    const simHour = elapsedMinutes / 60;
    const timestamp = new Date(baseTime + elapsedMinutes * 60 * 1000).toISOString();

    // Hydrograph peak: reaches peak around 25-35% of horizon
    const peakHour = horizonHours * 0.3;
    const hydrographCoeff = Math.exp(-Math.pow((simHour - peakHour) / (peakHour * 0.9), 2));
    const inflow = 800 + scenario.peakDischargeM3s * hydrographCoeff;

    // Depth and velocity matrices
    const depthGrid: number[][] = [];
    const uGrid: number[][] = [];
    const vGrid: number[][] = [];
    const speedGrid: number[][] = [];

    let totalDepth = 0;
    let maxDepth = 0;
    let floodedCells = 0;

    // Physics perturbation / model fidelity factor
    // PINO maintains clean conservation; ConvLSTM drifts over time; FNO has minor spectral oscillation
    const modelErrorCoeff =
      modelId === 'cnn-convlstm'
        ? 1.0 + Math.pow(simHour / 6, 1.8) * 0.15 // rapid error drift
        : modelId === 'fno-2d'
        ? 1.0 + Math.sin(simHour * 0.8) * 0.04
        : 1.0; // PINO adheres strictly to SWE

    for (let r = 0; r < gridSize; r++) {
      depthGrid[r] = [];
      uGrid[r] = [];
      vGrid[r] = [];
      speedGrid[r] = [];

      // Meandering river centerline across rows
      const meander = Math.sin((r / gridSize) * Math.PI * 3) * (gridSize * 0.15);
      const channelCenter = midCol + meander;

      for (let c = 0; c < gridSize; c++) {
        const distFromCenter = Math.abs(c - channelCenter);
        const inMainChannel = distFromCenter <= channelWidth / 2;

        let depth = 0;
        let u = 0;
        let v = 0;

        // Flood wave propagation front moving downstream (top to bottom: r = 0 -> gridSize)
        const waveFront = Math.min(gridSize + 5, (simHour / (horizonHours * 0.75)) * gridSize + 8);

        if (r <= waveFront) {
          const frontDecay = Math.max(0, 1 - Math.max(0, r - waveFront + 6) / 8);

          if (inMainChannel) {
            // Main riverbed flow
            const baseBedDepth = 1.8 + 2.4 * hydrographCoeff;
            const lateralProfile = Math.cos((distFromCenter / (channelWidth / 2)) * (Math.PI / 2));
            depth = baseBedDepth * lateralProfile * frontDecay * modelErrorCoeff;

            // Streamwise velocity downstream + lateral meander
            const baseSpeed = 1.4 + 1.2 * hydrographCoeff;
            v = baseSpeed * frontDecay; // Downstream (y direction)
            u = Math.cos((r / gridSize) * Math.PI * 3) * 0.6 * frontDecay; // Lateral curve
          } else {
            // Overbank floodplain inundation
            const overbankDist = distFromCenter - channelWidth / 2;
            const spillThreshold = 2.2;
            const channelSpill = (1.8 + 2.4 * hydrographCoeff) - spillThreshold;

            if (channelSpill > 0 && overbankDist < 16) {
              const floodSpread = Math.max(0, channelSpill * (1 - overbankDist / 16));
              depth = floodSpread * 0.7 * frontDecay * modelErrorCoeff;

              // Diverging velocity outward from channel
              const outwardDir = c > channelCenter ? 1 : -1;
              u = outwardDir * (0.35 + 0.3 * hydrographCoeff) * (1 - overbankDist / 16);
              v = (0.4 + 0.4 * hydrographCoeff) * (1 - overbankDist / 16);
            }
          }
        }

        // Add subtle physics terrain irregularity
        if (depth > 0.05) {
          const terrainNoise = Math.sin(r * 0.5) * Math.cos(c * 0.5) * 0.04;
          depth = Math.max(0, depth + terrainNoise);
        } else {
          depth = 0;
        }

        depth = Number(depth.toFixed(3));
        const speed = Number(Math.sqrt(u * u + v * v).toFixed(2));

        depthGrid[r][c] = depth;
        uGrid[r][c] = Number(u.toFixed(2));
        vGrid[r][c] = Number(v.toFixed(2));
        speedGrid[r][c] = speed;

        if (depth > 0.05) {
          totalDepth += depth;
          floodedCells++;
          if (depth > maxDepth) maxDepth = depth;
        }
      }
    }

    const meanDepth = floodedCells > 0 ? totalDepth / floodedCells : 0;
    const cellAreaKm2 = (scenario.catchmentAreaKm2 / (gridSize * gridSize)) * 0.4;
    const floodedAreaKm2 = floodedCells * cellAreaKm2;

    // Mass conservation residual drift calculation
    const massConservationResidual =
      modelId === 'cnn-convlstm'
        ? Number((0.02 + Math.pow(simHour / 12, 2) * 0.14).toFixed(4))
        : modelId === 'fno-2d'
        ? Number((0.008 + (simHour / 48) * 0.025).toFixed(4))
        : Number((0.0012 + Math.sin(simHour) * 0.0006).toFixed(4)); // PINO residual < 0.2%

    // Calculate depths at critical infrastructure coordinates
    const criticalPointDepths: Record<string, number> = {};
    for (const infra of CRITICAL_INFRASTRUCTURE) {
      const scale = gridSize / 64;
      const gx = Math.min(gridSize - 1, Math.max(0, Math.floor(infra.gridX * scale)));
      const gy = Math.min(gridSize - 1, Math.max(0, Math.floor(infra.gridY * scale)));
      criticalPointDepths[infra.id] = depthGrid[gy]?.[gx] ?? 0;
    }

    const frame: ForecastFrame = {
      frameIndex: step,
      timestepMinutes: stepMinutes,
      timestamp,
      simulationHour: Number(simHour.toFixed(2)),
      inflowM3s: Number(inflow.toFixed(1)),
      maxDepthMeters: Number(maxDepth.toFixed(2)),
      meanDepthMeters: Number(meanDepth.toFixed(2)),
      floodedAreaKm2: Number(floodedAreaKm2.toFixed(1)),
      massConservationResidual,
      depthGrid,
      criticalPointDepths
    };

    if (modelId !== 'cnn-convlstm') {
      frame.velocityGrid = {
        u: uGrid,
        v: vGrid,
        speed: speedGrid
      };
    }

    frames.push(frame);
  }

  return frames;
}

/**
 * Rollout error progression points over multi-step horizons.
 */
export function generateRolloutErrors(modelId: AIModelId, horizonHours: PredictionHorizonHours): RolloutErrorPoint[] {
  const steps = horizonHours <= 6 ? 12 : horizonHours <= 24 ? 24 : 48;
  const points: RolloutErrorPoint[] = [];

  for (let s = 1; s <= steps; s++) {
    const hour = Number(((s / steps) * horizonHours).toFixed(2));

    let mae = 0;
    let rmse = 0;
    let massErrorPct = 0;
    let uncertaintyWidth = 0;

    if (modelId === 'cnn-convlstm') {
      // Exponential / compounding error divergence
      mae = 0.045 + Math.pow(hour / 6, 1.6) * 0.082;
      rmse = 0.068 + Math.pow(hour / 6, 1.65) * 0.125;
      massErrorPct = 1.2 + Math.pow(hour / 5, 1.7) * 4.5;
      uncertaintyWidth = 0.03 + hour * 0.028;
    } else if (modelId === 'fno-2d') {
      // Sub-linear error growth, bounded spectral energy
      mae = 0.028 + (hour / horizonHours) * 0.052;
      rmse = 0.042 + (hour / horizonHours) * 0.078;
      massErrorPct = 0.65 + (hour / horizonHours) * 1.8;
      uncertaintyWidth = 0.02 + hour * 0.012;
    } else {
      // PINO: Physics loss bounds error strictly
      mae = 0.016 + (hour / horizonHours) * 0.022;
      rmse = 0.024 + (hour / horizonHours) * 0.035;
      massErrorPct = 0.22 + (hour / horizonHours) * 0.48;
      uncertaintyWidth = 0.012 + hour * 0.007;
    }

    points.push({
      step: s,
      hour,
      mae: Number(mae.toFixed(4)),
      rmse: Number(rmse.toFixed(4)),
      massErrorPct: Number(massErrorPct.toFixed(2)),
      uncertaintyLower: Number(Math.max(0, mae - uncertaintyWidth).toFixed(4)),
      uncertaintyUpper: Number((mae + uncertaintyWidth).toFixed(4))
    });
  }

  return points;
}

/**
 * Creates a complete mock ForecastRecord adhering to the required schema.
 */
export function createMockForecastRecord(
  modelId: AIModelId = 'pino-swe',
  scenarioId: string = 'krishna-inflow-surge',
  horizonHours: PredictionHorizonHours = 24
): ForecastRecord {
  const model = AI_MODELS.find((m) => m.id === modelId) || AI_MODELS[2];
  const scenario = FORECAST_SCENARIOS.find((s) => s.id === scenarioId) || FORECAST_SCENARIOS[0];
  const frames = generateSyntheticHydrodynamicFrames(modelId, scenarioId, horizonHours, 64);
  const rolloutErrors = generateRolloutErrors(modelId, horizonHours);

  // Model-specific metrics
  const metricProfiles: Record<AIModelId, { mae: number; rmse: number; csi: number; iou: number; massPct: number; duration: number; speedup: number; flops: string; mem: number; drift: number }> = {
    'cnn-convlstm': {
      mae: 0.142,
      rmse: 0.218,
      csi: 0.724,
      iou: 0.718,
      massPct: 8.45,
      duration: 38,
      speedup: 420,
      flops: '0.48 TFLOPs',
      mem: 1250,
      drift: 0.125
    },
    'fno-2d': {
      mae: 0.068,
      rmse: 0.104,
      csi: 0.884,
      iou: 0.876,
      massPct: 2.15,
      duration: 72,
      speedup: 290,
      flops: '1.24 TFLOPs',
      mem: 2400,
      drift: 0.048
    },
    'pino-swe': {
      mae: 0.034,
      rmse: 0.052,
      csi: 0.946,
      iou: 0.941,
      massPct: 0.62,
      duration: 138,
      speedup: 185,
      flops: '2.10 TFLOPs',
      mem: 3680,
      drift: 0.018
    }
  };

  const p = metricProfiles[modelId];

  // Peak frame for summary
  const peakFrame = [...frames].sort((a, b) => b.maxDepthMeters - a.maxDepthMeters)[0] || frames[0];

  return {
    id: `fc-${model.shortName.toLowerCase()}-${Date.now().toString(36)}`,
    status: 'completed',
    metadata: {
      id: `fc-${model.shortName.toLowerCase()}-${Date.now().toString(36)}`,
      modelId,
      scenarioId,
      horizonHours,
      timeStepMinutes: frames[1]?.timestepMinutes || 30,
      totalFrames: frames.length,
      gridResolution: {
        width: 64,
        height: 64,
        dxMeters: 25,
        dyMeters: 25
      },
      hardwareBackend: 'NVIDIA A100-SXM4-80GB (CUDA 12.4)',
      precision: 'bfloat16',
      checkpointHash: 'sha256:d8a4f912c30be24e16d41893c52e1b10a9058b8f2c8d',
      physicsLossWeight: modelId === 'pino-swe' ? 1.0 : undefined,
      massConservationEnforced: modelId === 'pino-swe',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3598000).toISOString(),
      inferenceDurationMs: p.duration,
      // VISIBLE MOCK RECOGNITION
      isMock: true,
      dataSource: 'SAMPLE_BENCHMARK_DATA',
      scientificDisclaimer: 'NOTICE: This simulation reflects sample benchmark data precomputed for interface validation. All inference metrics are labeled as simulated until live PyTorch model inference service (Member 9) is connected.'
    },
    summary: {
      peakDepthM: peakFrame.maxDepthMeters,
      peakInundationKm2: peakFrame.floodedAreaKm2,
      timeToPeakHours: peakFrame.simulationHour,
      criticalInfraAtRiskCount: 2,
      massResidualPeak: peakFrame.massConservationResidual
    },
    metrics: {
      mae: p.mae,
      rmse: p.rmse,
      csi: p.csi,
      iou: p.iou,
      massConservationErrorPct: p.massPct,
      inferenceDurationMs: p.duration,
      speedupFactor: p.speedup,
      rolloutDriftSlope: p.drift,
      memoryFootprintMb: p.mem,
      theoreticalFlops: p.flops
    },
    rolloutErrors,
    frames
  };
}

/**
 * Standard benchmark comparison records for all 3 AI models.
 */
export function getMockModelComparisons(scenarioId: string = 'krishna-inflow-surge'): ModelComparisonRecord[] {
  return AI_MODELS.map((model) => {
    const record = createMockForecastRecord(model.id, scenarioId, 24);
    const tradeoffSummaries: Record<AIModelId, string> = {
      'cnn-convlstm': 'Ultra-fast forward latency (<40ms), but error accumulates rapidly beyond 6h with severe mass conservation loss. Best for immediate early alerts.',
      'fno-2d': 'High accuracy, continuous resolution mapping via Fourier transform, and velocity prediction. Moderate mass drift over multi-day rollouts.',
      'pino-swe': 'Highest scientific rigor: Shallow Water continuity and momentum residual loss enforce mass conservation (<0.7% error). Superior stability for extended 24-48h rollouts.'
    };

    return {
      modelId: model.id,
      modelName: model.name,
      shortName: model.shortName,
      category: model.category,
      supportsVelocity: model.supportsVelocity,
      metrics: record.metrics,
      rolloutErrors: record.rolloutErrors,
      isMock: true,
      dataSource: 'SAMPLE_BENCHMARK_DATA',
      testedHorizonHours: 24,
      scenarioId,
      tradeoffSummary: tradeoffSummaries[model.id]
    };
  });
}
