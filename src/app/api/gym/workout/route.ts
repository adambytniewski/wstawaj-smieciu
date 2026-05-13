import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gymWorkouts, gymSets } from '@/lib/db/schema';
import { todayKey } from '@/lib/dates';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

const SetSchema = z.object({
  exercise: z.string().min(1),
  weightKg: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().int().min(1).max(10).optional(),
});

const WorkoutSchema = z.object({
  notes: z.string().optional(),
  sets: z.array(SetSchema).min(1),
});

export async function GET() {
  const workouts = db
    .select()
    .from(gymWorkouts)
    .orderBy(desc(gymWorkouts.startedAt))
    .limit(30)
    .all();
  const enriched = workouts.map((w) => {
    const sets = db.select().from(gymSets).where(eq(gymSets.workoutId, w.id)).all();
    return { ...w, sets };
  });
  return NextResponse.json({ workouts: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = WorkoutSchema.parse(body);
  const now = new Date();
  const totalVolume = parsed.sets.reduce((s, x) => s + x.weightKg * x.reps, 0);

  const [workout] = db
    .insert(gymWorkouts)
    .values({
      date: todayKey(now),
      startedAt: now,
      endedAt: now,
      notes: parsed.notes ?? null,
      totalVolume,
    })
    .returning()
    .all();

  parsed.sets.forEach((s, i) => {
    db.insert(gymSets)
      .values({
        workoutId: workout.id,
        exercise: s.exercise,
        weightKg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe ?? null,
        setIndex: i,
      })
      .run();
  });

  return NextResponse.json({ workout });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.delete(gymWorkouts).where(eq(gymWorkouts.id, id)).run();
  return NextResponse.json({ ok: true });
}
