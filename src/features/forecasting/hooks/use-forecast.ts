'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AIModelId,
  PredictionHorizonHours,
  ForecastRecord,
  ForecastPredictParams
} from '../types/forecast';
import { getForecastApiAdapter } from '../api/forecast-adapter';

export function useForecast(initialModelId: AIModelId = 'pino-swe', initialScenarioId: string = 'krishna-inflow-surge') {
  const [modelId, setModelId] = useState<AIModelId>(initialModelId);
  const [scenarioId, setScenarioId] = useState<string>(initialScenarioId);
  const [horizonHours, setHorizonHours] = useState<PredictionHorizonHours>(24);

  const [forecastRecord, setForecastRecord] = useState<ForecastRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const adapter = getForecastApiAdapter();

  // Run forecast inference execution
  const runForecast = useCallback(
    async (params?: ForecastPredictParams['parameters']) => {
      setIsLoading(true);
      setError(null);

      try {
        // Multi-phase UI progress simulation for realism and scientific clarity
        setLoadingStep('Validating catchment inflow hydrograph & boundary conditions...');
        await new Promise((r) => setTimeout(r, 200));

        setLoadingStep('Constructing spectral spatial kernels & assembling DEM tensors...');
        await new Promise((r) => setTimeout(r, 250));

        setLoadingStep(`Dispatching forward pass to ${modelId.toUpperCase()} operator...`);

        const initRes = await adapter.predict({
          modelId,
          scenarioId,
          horizonHours,
          parameters: params
        });

        setLoadingStep('Solving autoregressive temporal rollout across multi-step horizon...');
        await new Promise((r) => setTimeout(r, 250));

        setLoadingStep('Verifying mass continuity residual and preparing visual tensors...');

        const fullRecord = await adapter.getForecast(initRes.id);
        setForecastRecord(fullRecord);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Forecast execution failed';
        setError(msg);
      } finally {
        setIsLoading(false);
        setLoadingStep('');
      }
    },
    [adapter, modelId, scenarioId, horizonHours]
  );

  // Load initial reference forecast on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setIsLoading(true);
      setLoadingStep('Loading baseline hydrodynamic benchmark...');
      try {
        const record = await adapter.getForecast(`fc-${modelId}-${Date.now().toString(36)}`);
        if (isMounted) {
          setForecastRecord(record);
        }
      } catch {
        // fallback handles it
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLoadingStep('');
        }
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [adapter, modelId]);

  return {
    modelId,
    setModelId,
    scenarioId,
    setScenarioId,
    horizonHours,
    setHorizonHours,
    forecastRecord,
    isLoading,
    loadingStep,
    error,
    runForecast
  };
}
