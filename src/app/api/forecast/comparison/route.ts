import { NextRequest, NextResponse } from 'next/server';
import { getMockModelComparisons } from '@/features/forecasting/utils/mock-data';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const scenarioId = searchParams.get('scenarioId') || 'krishna-inflow-surge';

    const comparisons = getMockModelComparisons(scenarioId);

    return NextResponse.json(comparisons, {
      status: 200,
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
