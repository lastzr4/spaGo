import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Shared Web Push helper — same fail-open contract as lib/email.ts and
// lib/anthropic.ts: never throws, so a therapist's browser subscription
// hiccup can never break the booking flow that triggered the notification.
let configured = false;

function ensureConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@spago.app", publicKey, privateKey);
    configured = true;
  }
  return true;
}

// Sends to every device the therapist has subscribed on, and prunes any
// subscription the push service reports as gone (410/404 — browser
// uninstalled the PWA, cleared site data, etc.) so the table doesn't
// accumulate dead rows we'd keep failing to send to forever.
export async function sendPushToTherapist(
  therapistId: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number }> {
  if (!ensureConfigured()) return { sent: 0 };

  const subs = await prisma.pushSubscription.findMany({ where: { therapistId } });
  if (subs.length === 0) return { sent: 0 };

  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("[sendPushToTherapist] send failed:", err);
        }
      }
    })
  );

  return { sent };
}
