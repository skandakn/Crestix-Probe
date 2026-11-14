/**
 * Isolated API Adapter for Crestix Probe Forecasting Module (Member 6)
 *
 * Designed for clean coordination with Member 9 (PyTorch Inference Service).
 * Can point to local Next.js API routes or external inference service URL via NEXT_PUBLIC_FORECAST_API_URL.
 * Visibly distinguishes real PyTorch inference from sample benchmark mock data.
 */

import {
  ForecastPredictParams,
  ForecastInitiationResponse,
  ForecastRecord,
  ForecastFramesResponse,
  ForecastMetricsResponse,
  ModelComparisonRecord,
  ForecastScenario,
  AIModelInfo
} from '../types/forecast';
import { AI_MODELS, FORECAST_SCENARIOS } from '../utils/physics';
import { createMockForecastRecord, getMockModelComparisons } from '../utils/mock-data';

export interface ForecastApiAdapter {
  predict(params: ForecastPredictParams): Promise<ForecastInitiationResponse>;
  getForecast(id: string): Promise<ForecastRecord>;
  getFrames(id: string): Promise<ForecastFramesResponse>;
  getMetrics(id: string): Promise<ForecastMetricsResponse>;
  getModelComparisons(scenarioId?: string): Promise<ModelComparisonRecord[]>;
  getScenarios(): Promise<ForecastScenario[]>;
  getModels(): Promise<AIModelInfo[]>;
  getBaseUrl(): string;
  isLiveServiceAvailable(): Promise<boolean>;
}

export class HttpForecastApiAdapter implements ForecastApiAdapter {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? (process.env.NEXT_PUBLIC_FORECAST_API_URL || '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
  }

  getBaseUrl(): string {
    return this.baseUrl || '/api/forecast';
  }

  private isNodeTestEnvironment(): boolean {
    return typeof window === 'undefined' && !this.baseUrl.startsWith('http');
  }

  /**
   * Health check to detect if Member 9's live PyTorch inference engine is reachable.
   */
  async isLiveServiceAvailable(): Promise<boolean> {
    if (this.isNodeTestEnvironment()) return false;
    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/models`, {
        method: 'GET',
        headers: this.defaultHeaders,
        signal: AbortSignal.timeout(2000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * POST /api/forecast/predict
   */
  async predict(params: ForecastPredictParams): Promise<ForecastInitiationResponse> {
    if (this.isNodeTestEnvironment()) {
      return {
        id: `fc-${params.modelId}-${Date.now().toString(36)}`,
        status: 'completed',
        modelId: params.modelId,
        scenarioId: params.scenarioId,
        horizonHours: params.horizonHours,
        createdAt: new Date().toISOString(),
        estimatedDurationMs: params.modelId === 'pino-swe' ? 140 : 50,
        isMock: true,
        dataSource: 'SAMPLE_BENCHMARK_DATA'
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/predict`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(params)
      });

      if (!res.ok) {
        throw new Error(`Inference dispatch failed with status: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[ForecastAdapter] Live API predict request failed, using client fallback:', err);
      return {
        id: `fc-${params.modelId}-${Date.now().toString(36)}`,
        status: 'completed',
        modelId: params.modelId,
        scenarioId: params.scenarioId,
        horizonHours: params.horizonHours,
        createdAt: new Date().toISOString(),
        estimatedDurationMs: params.modelId === 'pino-swe' ? 140 : 50,
        isMock: true,
        dataSource: 'SAMPLE_BENCHMARK_DATA'
      };
    }
  }

  /**
   * GET /api/forecast/{id}
   */
  async getForecast(id: string): Promise<ForecastRecord> {
    if (this.isNodeTestEnvironment()) {
      let modelId: any = 'pino-swe';
      if (id.includes('convlstm')) modelId = 'cnn-convlstm';
      else if (id.includes('fno')) modelId = 'fno-2d';
      return createMockForecastRecord(modelId, 'krishna-inflow-surge', 24);
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!res.ok) {
        throw new Error(`Forecast retrieval failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[ForecastAdapter] Live API getForecast failed, using sample record:', err);
      return createMockForecastRecord('pino-swe', 'krishna-inflow-surge', 24);
    }
  }

  /**
   * GET /api/forecast/{id}/frames
   */
  async getFrames(id: string): Promise<ForecastFramesResponse> {
    if (this.isNodeTestEnvironment()) {
      const record = createMockForecastRecord('pino-swe', 'krishna-inflow-surge', 24);
      return {
        id,
        totalFrames: record.frames.length,
        timeStepMinutes: record.metadata.timeStepMinutes,
        horizonHours: record.metadata.horizonHours,
        isMock: true,
        frames: record.frames
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/${encodeURIComponent(id)}/frames`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!res.ok) {
        throw new Error(`Frames retrieval failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[ForecastAdapter] Live API getFrames failed, synthesizing sample frames:', err);
      const record = createMockForecastRecord('pino-swe', 'krishna-inflow-surge', 24);
      return {
        id,
        totalFrames: record.frames.length,
        timeStepMinutes: record.metadata.timeStepMinutes,
        horizonHours: record.metadata.horizonHours,
        isMock: true,
        frames: record.frames
      };
    }
  }

  /**
   * GET /api/forecast/{id}/metrics
   */
  async getMetrics(id: string): Promise<ForecastMetricsResponse> {
    if (this.isNodeTestEnvironment()) {
      const record = createMockForecastRecord('pino-swe', 'krishna-inflow-surge', 24);
      return {
        id,
        modelId: record.metadata.modelId,
        metrics: record.metrics,
        rolloutErrors: record.rolloutErrors,
        isMock: true
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/${encodeURIComponent(id)}/metrics`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!res.ok) {
        throw new Error(`Metrics retrieval failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[ForecastAdapter] Live API getMetrics failed, using sample metrics:', err);
      const record = createMockForecastRecord('pino-swe', 'krishna-inflow-surge', 24);
      return {
        id,
        modelId: record.metadata.modelId,
        metrics: record.metrics,
        rolloutErrors: record.rolloutErrors,
        isMock: true
      };
    }
  }

  /**
   * GET /api/forecast/comparison
   */
  async getModelComparisons(scenarioId: string = 'krishna-inflow-surge'): Promise<ModelComparisonRecord[]> {
    if (this.isNodeTestEnvironment()) {
      return getMockModelComparisons(scenarioId);
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/api/forecast/comparison?scenarioId=${encodeURIComponent(scenarioId)}`,
        {
          method: 'GET',
          headers: this.defaultHeaders
        }
      );

      if (!res.ok) {
        throw new Error(`Comparison retrieval failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[ForecastAdapter] Live API getModelComparisons failed, using benchmark comparison:', err);
      return getMockModelComparisons(scenarioId);
    }
  }

  async getScenarios(): Promise<ForecastScenario[]> {
    if (this.isNodeTestEnvironment()) return FORECAST_SCENARIOS;
    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/scenarios`, {
        method: 'GET',
        headers: this.defaultHeaders
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return FORECAST_SCENARIOS;
  }

  async getModels(): Promise<AIModelInfo[]> {
    if (this.isNodeTestEnvironment()) return AI_MODELS;
    try {
      const res = await fetch(`${this.baseUrl}/api/forecast/models`, {
        method: 'GET',
        headers: this.defaultHeaders
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return AI_MODELS;
  }
}

// Singleton adapter instance
let defaultAdapterInstance: ForecastApiAdapter | null = null;

export function getForecastApiAdapter(baseUrl?: string): ForecastApiAdapter {
  if (!defaultAdapterInstance || baseUrl) {
    defaultAdapterInstance = new HttpForecastApiAdapter(baseUrl);
  }
  return defaultAdapterInstance;
}
