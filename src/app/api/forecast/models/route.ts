import { NextResponse } from 'next/server';
import { AI_MODELS } from '@/features/forecasting/utils/physics';

export async function GET() {
  return NextResponse.json(AI_MODELS, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
