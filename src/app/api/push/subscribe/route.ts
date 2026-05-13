import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

const Schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.parse(body);
  const existing = db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, parsed.endpoint))
    .all()[0];
  if (existing) {
    db.update(pushSubscriptions)
      .set({ p256dh: parsed.keys.p256dh, auth: parsed.keys.auth, userAgent: parsed.userAgent ?? null })
      .where(eq(pushSubscriptions.id, existing.id))
      .run();
    return NextResponse.json({ ok: true, updated: true });
  }
  db.insert(pushSubscriptions)
    .values({
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
      userAgent: parsed.userAgent ?? null,
    })
    .run();
  return NextResponse.json({ ok: true, created: true });
}

export async function DELETE(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
  db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).run();
  return NextResponse.json({ ok: true });
}
