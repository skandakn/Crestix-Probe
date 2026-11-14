export type MetricValue = number | string | null

export interface ValidationMetrics {
  mae?: MetricValue
  rmse?: MetricValue
  csi?: MetricValue
  massConservationError?: MetricValue
  inferenceTimeAiMs?: MetricValue
  inferenceTimeSolverMs?: MetricValue
  stabilitySteps?: MetricValue
  stabilityTotalSteps?: MetricValue
  validationSummary?: string
  datasetLabel?: string
  scenarioType?: 'training' | 'test' | 'unknown'
  sensorCount?: number
  updatedAt?: string
}

export interface ComparisonPoint {
  time: string
  predictedDepthM?: number | null
  numericalDepthM?: number | null
  observedDepthM?: number | null
  rainfallMmH?: number | null
  aiErrorM?: number | null
  solverErrorM?: number | null
  aiExtentKm2?: number | null
  solverExtentKm2?: number | null
  observedExtentKm2?: number | null
  [key: string]: unknown
}

export interface Experiment {
  id: string
  name: string
  scenario?: string
  scenarioType?: 'training' | 'test' | 'unknown'
  createdAt?: string
  status?: string
  source?: string
  mae?: MetricValue
  rmse?: MetricValue
  csi?: MetricValue
}

export interface AnalyticsDataset {
  metrics: ValidationMetrics
  comparisons: ComparisonPoint[]
  experiments: Experiment[]
  source: 'backend' | 'sample' | 'empty'
  error?: string
}
