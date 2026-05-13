import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deepWorkSessions } from '@/lib/db/schema';
import { todayKey } from '@/lib/dates';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

const StartSchema = z.object({
  project: z.string().optional(),
  goal: z.string().optional(),
});

const FinishSchema = z.object({
  id: z.number(),
  notes: z.string().optional(),
  completed: z.boolean().default(true),
});

export async function GET() {
  const rows = await db
    .select()
    .from(deepWorkSessions)
    .orderBy(desc(deepWorkSessions.startedAt))
    .limit(50);
  return NextResponse.json({ sessions: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = StartSchema.parse(body);
  const now = new Date();
  const inserted = db
    .insert(deepWorkSessions)
    .values({
      startedAt: now,
      durationSec: 0,
      project: parsed.project ?? null,
      goal: parsed.goal ?? null,
      completed: false,
      date: todayKey(now),
    })
    .returning()
    .all();
  return NextResponse.json({ session: inserted[0] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = FinishSchema.parse(body);
  const existing = db
    .select()
    .from(deepWorkSessions)
    .where(eq(deepWorkSessions.id, parsed.id))
    .all()[0];
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const now = new Date();
  const durationSec = Math.max(0, Math.round((now.getTime() - existing.startedAt.getTime()) / 1000));
  db.update(deepWorkSessions)
    .set({
      endedAt: now,
      durationSec,
      notes: parsed.notes ?? existing.notes,
      completed: parsed.completed,
    })
    .where(eq(deepWorkSessions.id, parsed.id))
    .run();
  return NextResponse.json({ ok: true, durationSec });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.delete(deepWorkSessions).where(eq(deepWorkSessions.id, id)).run();
  return NextResponse.json({ ok: true });
}
