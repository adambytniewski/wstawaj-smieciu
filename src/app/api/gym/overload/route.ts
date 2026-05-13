import { NextRequest, NextResponse } from 'next/server';
import { getOverloadHistory } from '@/lib/stats';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const exercise = req.nextUrl.searchParams.get('exercise') ?? undefined;
  const days = Number(req.nextUrl.searchParams.get('days') ?? 90);
  const data = await getOverloadHistory(exercise, days);
  return NextResponse.json({ data });
}
