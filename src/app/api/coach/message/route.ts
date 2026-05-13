import { NextRequest, NextResponse } from 'next/server';
import { generateCoachMessage, type CoachKind } from '@/lib/coach';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 120;

const Schema = z.object({
  kind: z.enum(['daily', 'reactive', 'audit', 'wakeup']).default('daily'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { kind } = Schema.parse(body);
    const message = await generateCoachMessage(kind as CoachKind);
    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
