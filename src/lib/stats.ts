import 'server-only';
import { db } from './db';
import {
  deepWorkSessions,
  gymWorkouts,
  gymSets,
  sleepEntries,
  codingSessions,
} from './db/schema';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { lastNDaysKeys, todayKey, formatDuration, formatDurationMin } from './dates';

export interface DayStats {
  date: string;
  deepWorkMin: number;
  codingMin: number;
  gymVolume: number; // kg
  gymSets: number;
  sleepMin: number | null;
  sleepQuality: number | null;
}

export async function getDayStats(date: string): Promise<DayStats> {
  const [dw, codes, workouts, sleeps] = await Promise.all([
    db.select().from(deepWorkSessions).where(eq(deepWorkSessions.date, date)),
    db.select().from(codingSessions).where(eq(codingSessions.date, date)),
    db.select().from(gymWorkouts).where(eq(gymWorkouts.date, date)),
    db.select().from(sleepEntries).where(eq(sleepEntries.date, date)),
  ]);

  const deepWorkMin = Math.round(dw.reduce((s, r) => s + r.durationSec, 0) / 60);
  const codingMin = codes.reduce((s, r) => s + r.durationMin, 0);
  const gymVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);

  let setCount = 0;
  for (const w of workouts) {
    const sets = await db.select().from(gymSets).where(eq(gymSets.workoutId, w.id));
    setCount += sets.length;
  }

  const sleep = sleeps[0];
  return {
    date,
    deepWorkMin,
    codingMin,
    gymVolume,
    gymSets: setCount,
    sleepMin: sleep?.durationMin ?? null,
    sleepQuality: sleep?.quality ?? null,
  };
}

export async function getLastNDays(n: number): Promise<DayStats[]> {
  const keys = lastNDaysKeys(n);
  return Promise.all(keys.map(getDayStats));
}

export interface Streaks {
  deepWork: number;
  gym: number;
  sleepLogged: number;
}

function streakFromBoolArray(arr: boolean[]): number {
  // arr[0] is oldest, arr[last] is today
  let streak = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i]) streak++;
    else break;
  }
  return streak;
}

export async function getStreaks(): Promise<Streaks> {
  const days = await getLastNDays(60);
  return {
    deepWork: streakFromBoolArray(days.map((d) => d.deepWorkMin >= 60)), // ≥1h
    gym: streakFromBoolArray(days.map((d) => d.gymSets > 0)),
    sleepLogged: streakFromBoolArray(days.map((d) => d.sleepMin !== null)),
  };
}

export interface ProgressiveOverloadPoint {
  exercise: string;
  date: string;
  topWeightKg: number;
  topSetVolume: number; // best set's weight*reps
}

export async function getOverloadHistory(exercise?: string, days = 90): Promise<ProgressiveOverloadPoint[]> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const cutoffDate = todayKey(cutoff);

  const conditions = [gte(gymWorkouts.date, cutoffDate)];
  const workoutsList = await db.select().from(gymWorkouts).where(and(...conditions));

  const out: ProgressiveOverloadPoint[] = [];
  for (const w of workoutsList) {
    const sets = await db.select().from(gymSets).where(eq(gymSets.workoutId, w.id));
    const byEx = new Map<string, typeof sets>();
    for (const s of sets) {
      if (exercise && s.exercise.toLowerCase() !== exercise.toLowerCase()) continue;
      const arr = byEx.get(s.exercise) ?? [];
      arr.push(s);
      byEx.set(s.exercise, arr);
    }
    for (const [ex, exSets] of byEx) {
      const top = exSets.reduce((best, s) => (s.weightKg > best.weightKg ? s : best), exSets[0]);
      const topVolume = exSets.reduce((m, s) => Math.max(m, s.weightKg * s.reps), 0);
      out.push({
        exercise: ex,
        date: w.date,
        topWeightKg: top.weightKg,
        topSetVolume: topVolume,
      });
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export function summarizeContext(today: DayStats, week: DayStats[], streaks: Streaks): string {
  const wDeep = week.reduce((s, d) => s + d.deepWorkMin, 0);
  const wCode = week.reduce((s, d) => s + d.codingMin, 0);
  const wVol = week.reduce((s, d) => s + d.gymVolume, 0);
  const wGymDays = week.filter((d) => d.gymSets > 0).length;
  const wSleeps = week.filter((d) => d.sleepMin !== null);
  const avgSleep =
    wSleeps.length > 0 ? Math.round(wSleeps.reduce((s, d) => s + (d.sleepMin ?? 0), 0) / wSleeps.length) : null;

  return [
    `# Dziś (${today.date})`,
    `- Deep work: ${formatDurationMin(today.deepWorkMin)}`,
    `- AI coding (auto): ${formatDurationMin(today.codingMin)}`,
    `- Gym: ${today.gymSets} serii, ${Math.round(today.gymVolume)} kg objętości`,
    `- Sen poprzedniej nocy: ${today.sleepMin ? formatDurationMin(today.sleepMin) + ` (jakość ${today.sleepQuality}/10)` : 'BRAK WPISU'}`,
    ``,
    `# Ostatnie 7 dni`,
    `- Deep work łącznie: ${formatDurationMin(wDeep)}`,
    `- AI coding łącznie: ${formatDurationMin(wCode)}`,
    `- Treningi: ${wGymDays}/7 dni, ${Math.round(wVol)} kg objętości`,
    `- Średni sen: ${avgSleep ? formatDurationMin(avgSleep) : 'brak danych'}`,
    ``,
    `# Streaki`,
    `- Deep work (≥1h dziennie): ${streaks.deepWork} dni`,
    `- Trening: ${streaks.gym} dni`,
    `- Logowanie snu: ${streaks.sleepLogged} dni`,
  ].join('\n');
}
