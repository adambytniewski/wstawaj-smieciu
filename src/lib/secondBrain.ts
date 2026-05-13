import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

const SESSIONS_DIR =
  process.env.SECOND_BRAIN_SESSIONS ||
  'C:/Users/adamb/OneDrive/Dokumenty/SecondBrain/Sessions';

// Filename pattern: 2026-05-09-1923-claude-abc123.md
const FILE_RE = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})-claude-([a-f0-9]+)\.md$/;

export interface SBSessionMeta {
  fileName: string;
  filePath: string;
  startedAt: Date;
  date: string; // YYYY-MM-DD
  project?: string;
  title?: string;
  topics?: string[];
  durationMin: number; // estimated from session length
}

interface FrontMatter {
  date?: string;
  time?: string;
  project?: string;
  topics?: string[];
  session_id?: string;
}

function parseFrontMatter(text: string): { fm: FrontMatter; rest: string } {
  if (!text.startsWith('---')) return { fm: {}, rest: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, rest: text };
  const block = text.slice(3, end).trim();
  const rest = text.slice(end + 4).replace(/^\n+/, '');
  const fm: FrontMatter = {};
  for (const line of block.split('\n')) {
    const m = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1] as keyof FrontMatter;
    let value: any = m[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s: string) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^['"]|['"]$/g, '');
    }
    (fm as any)[key] = value;
  }
  return { fm, rest };
}

function extractTitle(body: string): string | undefined {
  const m = /^#\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : undefined;
}

// Heuristic: estimate session duration from word count (rough proxy for engagement)
function estimateDuration(body: string): number {
  const words = body.split(/\s+/).length;
  // ~200 words ≈ 1 min of thoughtful interaction (conservative)
  return Math.min(180, Math.max(5, Math.round(words / 200)));
}

export async function listRecentSessions(days = 30): Promise<SBSessionMeta[]> {
  const cutoff = Date.now() - days * 86_400_000;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(SESSIONS_DIR);
  } catch {
    return [];
  }

  const out: SBSessionMeta[] = [];
  for (const name of entries) {
    const m = FILE_RE.exec(name);
    if (!m) continue;
    const [, y, mo, d, hh, mm] = m;
    const startedAt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(hh),
      Number(mm)
    );
    if (startedAt.getTime() < cutoff) continue;

    const filePath = path.join(SESSIONS_DIR, name);
    let raw: string;
    try {
      raw = await fs.readFile(filePath, 'utf-8');
    } catch {
      continue;
    }
    const { fm, rest } = parseFrontMatter(raw);
    out.push({
      fileName: name,
      filePath,
      startedAt,
      date: `${y}-${mo}-${d}`,
      project: fm.project,
      title: extractTitle(rest),
      topics: fm.topics,
      durationMin: estimateDuration(rest),
    });
  }

  out.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  return out;
}

export async function todayCodingSessions(): Promise<SBSessionMeta[]> {
  const all = await listRecentSessions(2);
  const today = new Date();
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();
  const todayKey = `${ty}-${String(tm).padStart(2, '0')}-${String(td).padStart(2, '0')}`;
  return all.filter((s) => s.date === todayKey);
}
