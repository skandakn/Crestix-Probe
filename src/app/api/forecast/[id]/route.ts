import { NextRequest, NextResponse } from 'next/server';
import { findForecastRecord } from '@/features/forecasting/api/server-store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ error: 'Forecast ID is required' }, { status: 400 });
    }

    const record = findForecastRecord(id);

    return NextResponse.json(record, {
      status: 200,
      headers: {
        'x-forecast-source': record.metadata.dataSource,
        'x-forecast-mock': record.metadata.isMock ? 'true' : 'false'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

