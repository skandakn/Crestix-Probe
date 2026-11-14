import { NextRequest, NextResponse } from 'next/server';
import { ForecastPredictParams, ForecastInitiationResponse } from '@/features/forecasting/types/forecast';
import { createMockForecastRecord } from '@/features/forecasting/utils/mock-data';
import { saveForecastRecord } from '@/features/forecasting/api/server-store';

export async function POST(req: NextRequest) {
  try {
    const body: ForecastPredictParams = await req.json();

    if (!body.modelId || !body.scenarioId || !body.horizonHours) {
      return NextResponse.json(
        { error: 'Missing required parameters: modelId, scenarioId, and horizonHours are required.' },
        { status: 400 }
      );
    }

    // Generate hydrodynamic forecast record
    const record = createMockForecastRecord(body.modelId, body.scenarioId, body.horizonHours);
    saveForecastRecord(record);

    const response: ForecastInitiationResponse = {
      id: record.id,
      status: 'completed',
      modelId: body.modelId,
      scenarioId: body.scenarioId,
      horizonHours: body.horizonHours,
      createdAt: record.metadata.createdAt,
      estimatedDurationMs: record.metrics.inferenceDurationMs,
      // Flag visibly as benchmark sample data
      isMock: true,
      dataSource: 'SAMPLE_BENCHMARK_DATA'
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'x-forecast-source': 'SAMPLE_BENCHMARK_DATA',
        'x-forecast-mock': 'true'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
