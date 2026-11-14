import type { AnalyticsDataset, ComparisonPoint, Experiment, ValidationMetrics } from './types'

const sample: AnalyticsDataset = {
  source: 'sample',
  metrics: {
    mae: 0.084, rmse: 0.126, csi: 0.72, massConservationError: 1.8,
    inferenceTimeAiMs: 42, inferenceTimeSolverMs: 680, stabilitySteps: 24,
    stabilityTotalSteps: 24, validationSummary: 'Illustrative values for interface preview only.',
    datasetLabel: 'Illustrative sample scenario', scenarioType: 'test', sensorCount: 3,
  },
  comparisons: [
    { time: '00:00', predictedDepthM: 0.08, numericalDepthM: 0.07, observedDepthM: 0.06, rainfallMmH: 0, aiErrorM: 0.02, solverErrorM: 0.01, aiExtentKm2: 0.2, solverExtentKm2: 0.18, observedExtentKm2: 0.16 },
    { time: '00:15', predictedDepthM: 0.14, numericalDepthM: 0.12, observedDepthM: 0.13, rainfallMmH: 8, aiErrorM: 0.01, solverErrorM: 0.01, aiExtentKm2: 0.32, solverExtentKm2: 0.28, observedExtentKm2: 0.3 },
    { time: '00:30', predictedDepthM: 0.26, numericalDepthM: 0.23, observedDepthM: 0.24, rainfallMmH: 18, aiErrorM: 0.02, solverErrorM: 0.01, aiExtentKm2: 0.48, solverExtentKm2: 0.42, observedExtentKm2: 0.45 },
    { time: '00:45', predictedDepthM: 0.39, numericalDepthM: 0.35, observedDepthM: 0.37, rainfallMmH: 24, aiErrorM: 0.02, solverErrorM: 0.02, aiExtentKm2: 0.71, solverExtentKm2: 0.64, observedExtentKm2: 0.68 },
    { time: '01:00', predictedDepthM: 0.51, numericalDepthM: 0.46, observedDepthM: 0.49, rainfallMmH: 16, aiErrorM: 0.02, solverErrorM: 0.03, aiExtentKm2: 0.94, solverExtentKm2: 0.86, observedExtentKm2: 0.91 },
    { time: '01:15', predictedDepthM: 0.47, numericalDepthM: 0.43, observedDepthM: 0.45, rainfallMmH: 5, aiErrorM: 0.02, solverErrorM: 0.02, aiExtentKm2: 0.88, solverExtentKm2: 0.8, observedExtentKm2: 0.84 },
    { time: '01:30', predictedDepthM: 0.35, numericalDepthM: 0.32, observedDepthM: 0.33, rainfallMmH: 0, aiErrorM: 0.02, solverErrorM: 0.01, aiExtentKm2: 0.69, solverExtentKm2: 0.62, observedExtentKm2: 0.65 },
    { time: '01:45', predictedDepthM: 0.22, numericalDepthM: 0.2, observedDepthM: 0.21, rainfallMmH: 0, aiErrorM: 0.01, solverErrorM: 0.01, aiExtentKm2: 0.44, solverExtentKm2: 0.39, observedExtentKm2: 0.41 },
  ],
  experiments: [
    { id: 'sample-01', name: 'Sample urban catchment run', scenario: 'Urban catchment · 15 min', scenarioType: 'test', createdAt: '2026-11-12T09:20:00Z', status: 'Complete', source: 'Sample', mae: 0.084, rmse: 0.126, csi: 0.72 },
    { id: 'sample-02', name: 'Sample rainfall pulse', scenario: 'Rainfall pulse · 30 min', scenarioType: 'training', createdAt: '2026-11-10T14:05:00Z', status: 'Complete', source: 'Sample', mae: 0.091, rmse: 0.139, csi: 0.68 },
    { id: 'sample-03', name: 'Sample sensor validation', scenario: 'Sensor comparison · 10 min', scenarioType: 'test', createdAt: '2026-11-08T07:45:00Z', status: 'Complete', source: 'Sample', mae: 0.076, rmse: 0.118, csi: 0.75 },
  ],
}

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json() as Promise<T>
}

const unwrap = <T,>(value: unknown, keys: string[]): T => {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    for (const key of keys) if (obj[key] !== undefined) return obj[key] as T
  }
  return value as T
}

export async function loadAnalytics(): Promise<AnalyticsDataset> {
  try {
    const [metricsRaw, comparisonsRaw, experimentsRaw] = await Promise.all([
      json<unknown>('/api/validation/metrics'),
      json<unknown>('/api/validation/comparisons'),
      json<unknown>('/api/experiments'),
    ])
    const metrics = unwrap<ValidationMetrics>(metricsRaw, ['metrics', 'data'])
    const comparisons = unwrap<ComparisonPoint[]>(comparisonsRaw, ['comparisons', 'data', 'points'])
    const experiments = unwrap<Experiment[]>(experimentsRaw, ['experiments', 'data', 'items'])
    if (!Array.isArray(comparisons) || !Array.isArray(experiments)) throw new Error('The validation API returned an unexpected data shape.')
    return { metrics: metrics ?? {}, comparisons, experiments, source: 'backend' }
  } catch (error) {
    return { ...sample, source: 'sample', error: error instanceof Error ? error.message : 'Validation API unavailable' }
  }
}

export async function getExperimentReport(id: string): Promise<string | null> {
  if (id.startsWith('sample-')) return null
  const response = await fetch(`/api/experiments/${encodeURIComponent(id)}/report`, { headers: { Accept: 'text/csv, application/json' } })
  if (!response.ok) throw new Error(`Report request returned ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/csv')) return response.text()
  const body = await response.json() as { csv?: string; report?: string }
  return body.csv ?? body.report ?? null
}

export function sampleDataset() { return sample }
