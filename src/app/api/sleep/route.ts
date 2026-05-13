import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sleepEntries } from '@/lib/db/schema';
import { todayKey } from '@/lib/dates';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

const SleepSchema = z.object({
  bedtime: z.string(), // ISO string
  wakeTime: z.string(),
  quality: z.number().int().min(1).max(10),
  notes: z.string().optional(),
});

export async function GET() {
  const rows = db
    .select()
    .from(sleepEntries)
    .orderBy(desc(sleepEntries.date))
    .limit(60)
    .all();
  return NextResponse.json({ entries: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SleepSchema.parse(body);
  const bedtime = new Date(parsed.bedtime);
  const wakeTime = new Date(parsed.wakeTime);
  const durationMin = Math.max(0, Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000));
  const date = todayKey(wakeTime);

  // Upsert by date
  const existing = db.select().from(sleepEntries).where(eq(sleepEntries.date, date)).all()[0];
  if (existing) {
    db.update(sleepEntries)
      .set({ bedtime, wakeTime, durationMin, quality: parsed.quality, notes: parsed.notes ?? null })
      .where(eq(sleepEntries.id, existing.id))
      .run();
    return NextResponse.json({ ok: true, updated: true });
  }
  const [entry] = db
    .insert(sleepEntries)
    .values({ date, bedtime, wakeTime, durationMin, quality: parsed.quality, notes: parsed.notes ?? null })
    .returning()
    .all();
  return NextResponse.json({ entry });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.delete(sleepEntries).where(eq(sleepEntries.id, id)).run();
  return NextResponse.json({ ok: true });
}
