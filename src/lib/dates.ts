// Local date helpers (everything in user's local timezone — single user, single device usage)

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayKey(d: Date): string {
  return todayKey(d);
}

export function lastNDaysKeys(n: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(todayKey(d));
  }
  return keys;
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}min`;
}

export function formatDurationMin(min: number): string {
  return formatDuration(min * 60);
}

export function startOfWeek(d: Date = new Date()): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // start on Monday
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
