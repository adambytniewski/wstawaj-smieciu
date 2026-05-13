import 'server-only';
import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions } from './db/schema';
import { eq } from 'drizzle-orm';

let configured = false;

export function configurePush() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT || 'mailto:adam@example.com';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(sub, pub, priv);
  configured = true;
  return true;
}

export async function sendPushToAll(payload: { title: string; body: string; url?: string }) {
  if (!configurePush()) {
    return { sent: 0, error: 'VAPID keys not configured' };
  }
  const subs = db.select().from(pushSubscriptions).all();
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (e: any) {
      // 410 Gone or 404 → cleanup
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id)).run();
      }
    }
  }
  return { sent };
}
