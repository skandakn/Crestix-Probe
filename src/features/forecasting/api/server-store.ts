import { ForecastRecord, AIModelId, PredictionHorizonHours } from '../types/forecast';
import { createMockForecastRecord } from '../utils/mock-data';

// Global cache for server route handlers
const globalStore = new Map<string, ForecastRecord>();

// Pre-populate with standard reference runs
const defaultRuns: Array<{ modelId: AIModelId; scenarioId: string; horizonHours: PredictionHorizonHours }> = [
  { modelId: 'pino-swe', scenarioId: 'krishna-inflow-surge', horizonHours: 24 },
  { modelId: 'fno-2d', scenarioId: 'krishna-inflow-surge', horizonHours: 24 },
  { modelId: 'cnn-convlstm', scenarioId: 'krishna-inflow-surge', horizonHours: 24 }
];

for (const run of defaultRuns) {
  const record = createMockForecastRecord(run.modelId, run.scenarioId, run.horizonHours);
  globalStore.set(record.id, record);
}

export function saveForecastRecord(record: ForecastRecord): void {
  globalStore.set(record.id, record);
}

export function findForecastRecord(id: string): ForecastRecord {
  if (globalStore.has(id)) {
    return globalStore.get(id)!;
  }

  // Parse ID pattern if generated (e.g. fc-pino-xxx)
  let modelId: AIModelId = 'pino-swe';
  if (id.includes('convlstm')) modelId = 'cnn-convlstm';
  else if (id.includes('fno')) modelId = 'fno-2d';

  const generated = createMockForecastRecord(modelId, 'krishna-inflow-surge', 24);
  generated.id = id;
  generated.metadata.id = id;
  globalStore.set(id, generated);
  return generated;
}

