import { NextResponse } from 'next/server';
import { getDayStats, getStreaks } from '@/lib/stats';
import { todayKey } from '@/lib/dates';

export const runtime = 'nodejs';

export async function GET() {
  const today = todayKey();
  const [stats, streaks] = await Promise.all([getDayStats(today), getStreaks()]);
  return NextResponse.json({ today, stats, streaks });
}
