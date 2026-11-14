'use client';

import { useState, useEffect } from 'react';
import { ModelComparisonRecord } from '../types/forecast';
import { getForecastApiAdapter } from '../api/forecast-adapter';

export function useModelComparison(scenarioId: string = 'krishna-inflow-surge') {
  const [comparisons, setComparisons] = useState<ModelComparisonRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const adapter = getForecastApiAdapter();

  useEffect(() => {
    let isMounted = true;

    async function fetchComparisons() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await adapter.getModelComparisons(scenarioId);
        if (isMounted) {
          setComparisons(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch comparison records');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchComparisons();

    return () => {
      isMounted = false;
    };
  }, [adapter, scenarioId]);

  return {
    comparisons,
    isLoading,
    error
  };
}
