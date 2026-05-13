import { NextResponse } from 'next/server';
import { sendPushToAll } from '@/lib/push';
import { generateCoachMessage } from '@/lib/coach';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST() {
  let body: string;
  try {
    body = await generateCoachMessage('reactive');
  } catch {
    body = 'Wstawaj śmieciu — push działa.';
  }
  const result = await sendPushToAll({
    title: 'wstawaj śmieciu',
    body: body.slice(0, 240),
    url: '/',
  });
  return NextResponse.json(result);
}
