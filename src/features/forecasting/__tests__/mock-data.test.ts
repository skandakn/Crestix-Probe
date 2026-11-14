import { test, describe } from 'vitest';
import assert from 'node:assert';
import {
  generateSyntheticHydrodynamicFrames,
  generateRolloutErrors,
  createMockForecastRecord,
  getMockModelComparisons
} from '../utils/mock-data';

describe('Hydrodynamic Benchmark Simulation & Mock Separation (Member 6)', () => {
  test('generates valid multi-step hydrodynamic frames across time horizons', () => {
    const frames = generateSyntheticHydrodynamicFrames('pino-swe', 'krishna-inflow-surge', 6, 32);
    assert.ok(frames.length > 0, 'Frames should be generated');

    const firstFrame = frames[0];
    assert.strictEqual(firstFrame.frameIndex, 0);
    assert.strictEqual(firstFrame.simulationHour, 0);
    assert.strictEqual(firstFrame.depthGrid.length, 32);
    assert.strictEqual(firstFrame.depthGrid[0].length, 32);

    // PINO includes velocity grid
    assert.ok(firstFrame.velocityGrid, 'PINO must generate velocity fields');
    assert.strictEqual(firstFrame.velocityGrid?.u.length, 32);
    assert.strictEqual(firstFrame.velocityGrid?.v.length, 32);
    assert.strictEqual(firstFrame.velocityGrid?.speed.length, 32);
  });

  test('ConvLSTM omits velocity field appropriately', () => {
    const frames = generateSyntheticHydrodynamicFrames('cnn-convlstm', 'krishna-inflow-surge', 3, 32);
    assert.strictEqual(frames[0].velocityGrid, undefined, 'ConvLSTM must not have velocity grid');
  });

  test('ensures mock data is visibly separated and identified as sample benchmark data', () => {
    const record = createMockForecastRecord('pino-swe', 'krishna-inflow-surge', 24);

    assert.strictEqual(record.metadata.isMock, true, 'isMock must be true');
    assert.strictEqual(record.metadata.dataSource, 'SAMPLE_BENCHMARK_DATA');
    assert.ok(
      record.metadata.scientificDisclaimer.includes('sample benchmark data'),
      'Disclaimer must clearly identify sample data'
    );
    assert.ok(record.metrics.mae > 0, 'MAE must be present');
    assert.ok(record.metrics.rmse > 0, 'RMSE must be present');
    assert.ok(record.metrics.massConservationErrorPct > 0, 'Mass conservation must be calculated');
  });

  test('generates model comparison benchmarks for all three models', () => {
    const comparisons = getMockModelComparisons('krishna-inflow-surge');
    assert.strictEqual(comparisons.length, 3, 'Must contain 3 models in comparison');

    for (const comp of comparisons) {
      assert.strictEqual(comp.isMock, true, 'Comparison must be flagged as sample data');
      assert.strictEqual(comp.dataSource, 'SAMPLE_BENCHMARK_DATA');
      assert.ok(comp.metrics.mae > 0);
      assert.ok(comp.metrics.rmse > 0);
      assert.ok(comp.metrics.massConservationErrorPct >= 0);
      assert.ok(comp.rolloutErrors.length > 0);
    }

    // PINO should have lowest mass error
    const pino = comparisons.find((c) => c.modelId === 'pino-swe');
    const convlstm = comparisons.find((c) => c.modelId === 'cnn-convlstm');
    assert.ok(
      (pino?.metrics.massConservationErrorPct ?? 10) < (convlstm?.metrics.massConservationErrorPct ?? 0),
      'PINO mass conservation error must be strictly lower than ConvLSTM'
    );
  });
});
