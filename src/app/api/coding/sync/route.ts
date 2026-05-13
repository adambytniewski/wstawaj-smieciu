import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { codingSessions } from '@/lib/db/schema';
import { listRecentSessions } from '@/lib/secondBrain';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST() {
  const sessions = await listRecentSessions(60);
  let added = 0;
  let updated = 0;
  for (const s of sessions) {
    const existing = db
      .select()
      .from(codingSessions)
      .where(eq(codingSessions.fileName, s.fileName))
      .all()[0];
    if (existing) {
      if (existing.durationMin !== s.durationMin || existing.title !== (s.title ?? null)) {
        db.update(codingSessions)
          .set({
            durationMin: s.durationMin,
            title: s.title ?? null,
            project: s.project ?? null,
            topics: s.topics ? JSON.stringify(s.topics) : null,
          })
          .where(eq(codingSessions.id, existing.id))
          .run();
        updated++;
      }
    } else {
      db.insert(codingSessions)
        .values({
          date: s.date,
          fileName: s.fileName,
          startedAt: s.startedAt,
          durationMin: s.durationMin,
          project: s.project ?? null,
          title: s.title ?? null,
          topics: s.topics ? JSON.stringify(s.topics) : null,
        })
        .run();
      added++;
    }
  }
  return NextResponse.json({ scanned: sessions.length, added, updated });
}

export async function GET() {
  const rows = db
    .select()
    .from(codingSessions)
    .orderBy(desc(codingSessions.startedAt))
    .limit(60)
    .all();
  return NextResponse.json({ sessions: rows });
}
