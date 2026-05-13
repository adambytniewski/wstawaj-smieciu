import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── DEEP WORK ──────────────────────────────────────────────────────
export const deepWorkSessions = sqliteTable('deep_work_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  durationSec: integer('duration_sec').notNull().default(0),
  project: text('project'),
  goal: text('goal'),
  notes: text('notes'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  date: text('date').notNull(), // YYYY-MM-DD (local) for fast aggregations
});

// ─── GYM ────────────────────────────────────────────────────────────
export const gymWorkouts = sqliteTable('gym_workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  notes: text('notes'),
  totalVolume: real('total_volume').notNull().default(0), // sum(weight*reps)
});

export const gymSets = sqliteTable('gym_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id')
    .notNull()
    .references(() => gymWorkouts.id, { onDelete: 'cascade' }),
  exercise: text('exercise').notNull(),
  weightKg: real('weight_kg').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  rpe: integer('rpe'), // 1-10 perceived exertion (optional)
  setIndex: integer('set_index').notNull().default(0),
});

// ─── SLEEP ──────────────────────────────────────────────────────────
export const sleepEntries = sqliteTable('sleep_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD (the wake date)
  bedtime: integer('bedtime', { mode: 'timestamp_ms' }).notNull(),
  wakeTime: integer('wake_time', { mode: 'timestamp_ms' }).notNull(),
  durationMin: integer('duration_min').notNull(),
  quality: integer('quality').notNull().default(5), // 1-10
  notes: text('notes'),
});

// ─── AI CODING (auto from Second Brain) ────────────────────────────
export const codingSessions = sqliteTable('coding_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  fileName: text('file_name').notNull().unique(), // dedup by source filename
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  durationMin: integer('duration_min').notNull().default(0),
  project: text('project'),
  title: text('title'),
  topics: text('topics'), // JSON array
});

// ─── COACH (AI messages + chat history) ────────────────────────────
export const coachMessages = sqliteTable('coach_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  role: text('role', { enum: ['user', 'coach'] }).notNull(),
  content: text('content').notNull(),
  kind: text('kind', { enum: ['daily', 'reactive', 'chat', 'audit'] })
    .notNull()
    .default('chat'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
});

// ─── PUSH SUBSCRIPTIONS ────────────────────────────────────────────
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ─── SETTINGS / TARGETS ────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type DeepWorkSession = typeof deepWorkSessions.$inferSelect;
export type GymWorkout = typeof gymWorkouts.$inferSelect;
export type GymSet = typeof gymSets.$inferSelect;
export type SleepEntry = typeof sleepEntries.$inferSelect;
export type CodingSession = typeof codingSessions.$inferSelect;
export type CoachMessage = typeof coachMessages.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
