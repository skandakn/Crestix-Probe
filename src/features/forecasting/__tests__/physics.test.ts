import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  AI_MODELS,
  FORECAST_SCENARIOS,
  CRITICAL_INFRASTRUCTURE,
  getWaterDepthColor,
  getVelocityColor,
  getHazardLevel,
  calculateEvaluationMetrics
} from '../utils/physics';

describe('Physics & AI Model Specifications (Member 6)', () => {
  test('contains all 3 required AI models: CNN/ConvLSTM, FNO, and PINO', () => {
    const modelIds = AI_MODELS.map((m) => m.id);
    assert.ok(modelIds.includes('cnn-convlstm'), 'ConvLSTM baseline must exist');
    assert.ok(modelIds.includes('fno-2d'), 'Fourier Neural Operator must exist');
    assert.ok(modelIds.includes('pino-swe'), 'PINO Shallow Water Equation model must exist');
  });

  test('verifies velocity support flags correctly per architecture', () => {
    const convlstm = AI_MODELS.find((m) => m.id === 'cnn-convlstm');
    const fno = AI_MODELS.find((m) => m.id === 'fno-2d');
    const pino = AI_MODELS.find((m) => m.id === 'pino-swe');

    assert.strictEqual(convlstm?.supportsVelocity, false, 'ConvLSTM baseline cannot estimate velocity');
    assert.strictEqual(fno?.supportsVelocity, true, 'FNO-2D must support velocity vector field');
    assert.strictEqual(pino?.supportsVelocity, true, 'PINO-SWE must support velocity vector field');
  });

  test('verifies catchment scenarios provide complete boundary and elevation specifications', () => {
    assert.ok(FORECAST_SCENARIOS.length >= 3, 'Must define standard catchment scenarios');
    for (const scenario of FORECAST_SCENARIOS) {
      assert.ok(scenario.catchmentAreaKm2 > 0, 'Catchment area must be positive');
      assert.ok(scenario.peakDischargeM3s > 0, 'Peak discharge must be positive');
      assert.ok(scenario.manningRoughness > 0, 'Manning roughness must be non-zero');
      assert.ok(scenario.elevationRange.max > scenario.elevationRange.min, 'Max elevation must exceed min');
    }
  });

  test('correctly maps water depths to scientific bathymetric colors', () => {
    const dry = getWaterDepthColor(0.0);
    assert.strictEqual(dry.a, 0.0, 'Dry cell should be transparent');

    const shallow = getWaterDepthColor(0.15);
    assert.ok(shallow.a > 0, 'Shallow depth should be visible');

    const deep = getWaterDepthColor(3.5);
    assert.ok(deep.r > 100, 'Deep inundation should shift to high-severity spectrum');
  });

  test('evaluates hydrodynamic accuracy metrics (MAE, RMSE, CSI, Mass Conservation)', () => {
    const pred = [
      [1.0, 2.0],
      [0.0, 0.5]
    ];
    const gt = [
      [1.1, 1.9],
      [0.0, 0.6]
    ];

    const metrics = calculateEvaluationMetrics(pred, gt, 120, 1000, 1005);
    assert.ok(metrics.mae > 0 && metrics.mae < 0.2, 'MAE should reflect differences');
    assert.ok(metrics.rmse >= metrics.mae, 'RMSE must be >= MAE mathematically');
    assert.ok(metrics.csi > 0.8, 'CSI should be high for aligned inundation');
    assert.strictEqual(metrics.massConservationErrorPct, 0.5, 'Mass conservation error should be exactly 0.5%');
  });
});
