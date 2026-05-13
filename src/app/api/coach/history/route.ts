import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coachMessages } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const rows = db
    .select()
    .from(coachMessages)
    .orderBy(desc(coachMessages.createdAt))
    .limit(50)
    .all();
  return NextResponse.json({ messages: rows.reverse() });
}
