import 'server-only';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'wstawaj.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Lazy schema bootstrap (no migration tooling needed in dev)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS deep_work_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration_sec INTEGER NOT NULL DEFAULT 0,
    project TEXT,
    goal TEXT,
    notes TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_dw_date ON deep_work_sessions(date);

  CREATE TABLE IF NOT EXISTS gym_workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    notes TEXT,
    total_volume REAL NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_gym_date ON gym_workouts(date);

  CREATE TABLE IF NOT EXISTS gym_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL REFERENCES gym_workouts(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    weight_kg REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rpe INTEGER,
    set_index INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_gym_sets_workout ON gym_sets(workout_id);
  CREATE INDEX IF NOT EXISTS idx_gym_sets_exercise ON gym_sets(exercise);

  CREATE TABLE IF NOT EXISTS sleep_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    bedtime INTEGER NOT NULL,
    wake_time INTEGER NOT NULL,
    duration_min INTEGER NOT NULL,
    quality INTEGER NOT NULL DEFAULT 5,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS coding_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    file_name TEXT NOT NULL UNIQUE,
    started_at INTEGER NOT NULL,
    duration_min INTEGER NOT NULL DEFAULT 0,
    project TEXT,
    title TEXT,
    topics TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_coding_date ON coding_sessions(date);

  CREATE TABLE IF NOT EXISTS coach_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'chat',
    read INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_coach_created ON coach_messages(created_at DESC);

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
export { schema };
export { sqlite as rawDb };
