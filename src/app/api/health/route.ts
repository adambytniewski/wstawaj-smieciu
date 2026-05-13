import { NextResponse } from 'next/server';
import { ollamaHealthcheck } from '@/lib/ollama';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const ollama = await ollamaHealthcheck();
  let dbOk = false;
  try {
    db.run(sql`SELECT 1`);
    dbOk = true;
  } catch {}
  return NextResponse.json({ ollama, db: dbOk });
}
