import { test, describe } from 'vitest';
import assert from 'node:assert';
import { HttpForecastApiAdapter, getForecastApiAdapter } from '../api/forecast-adapter';

describe('Isolated Forecast API Adapter (Member 6 / Member 9 Contract)', () => {
  test('adapter implements singleton and default base URL', () => {
    const adapter = getForecastApiAdapter();
    assert.ok(adapter, 'Adapter instance must exist');
    assert.strictEqual(adapter.getBaseUrl(), '/api/forecast');
  });

  test('initiates prediction and returns structured response tagged with mock provenance', async () => {
    const adapter = new HttpForecastApiAdapter();
    const res = await adapter.predict({
      modelId: 'pino-swe',
      scenarioId: 'krishna-inflow-surge',
      horizonHours: 12
    });

    assert.ok(res.id, 'Forecast ID must be assigned');
    assert.strictEqual(res.modelId, 'pino-swe');
    assert.strictEqual(res.horizonHours, 12);
    assert.strictEqual(res.isMock, true, 'Fallback/Mock must flag isMock=true');
    assert.strictEqual(res.dataSource, 'SAMPLE_BENCHMARK_DATA');
  });

  test('retrieves full forecast record with metadata and summary', async () => {
    const adapter = new HttpForecastApiAdapter();
    const record = await adapter.getForecast('test-id');

    assert.ok(record.metadata, 'Metadata must be present');
    assert.ok(record.metrics, 'Metrics must be present');
    assert.ok(record.frames.length > 0, 'Frames must be present');
    assert.strictEqual(record.metadata.isMock, true);
  });

  test('retrieves multi-model comparative records', async () => {
    const adapter = new HttpForecastApiAdapter();
    const comparisons = await adapter.getModelComparisons();

    assert.strictEqual(comparisons.length, 3);
    const names = comparisons.map((c) => c.shortName);
    assert.ok(names.includes('ConvLSTM'));
    assert.ok(names.includes('FNO-2D'));
    assert.ok(names.includes('PINO-SWE'));
  });
});
