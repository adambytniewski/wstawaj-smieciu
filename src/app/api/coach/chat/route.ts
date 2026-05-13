import { NextRequest, NextResponse } from 'next/server';
import { generateCoachMessage } from '@/lib/coach';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 120;

const Schema = z.object({
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = Schema.parse(body);
    const reply = await generateCoachMessage('chat', message);
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
