import { NextResponse } from 'next/server';
import { FORECAST_SCENARIOS } from '@/features/forecasting/utils/physics';

export async function GET() {
  return NextResponse.json(FORECAST_SCENARIOS, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

