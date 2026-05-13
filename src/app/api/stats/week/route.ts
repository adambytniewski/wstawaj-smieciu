import { NextRequest, NextResponse } from 'next/server';
import { getLastNDays } from '@/lib/stats';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get('days') ?? 7);
  const data = await getLastNDays(Math.min(60, Math.max(1, days)));
  return NextResponse.json({ data });
}
