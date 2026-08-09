import { Resend } from "resend";

// Shared client + helper for outbound transactional email (currently just the
// "new therapist registered" admin notification). Mirrors lib/anthropic.ts's
// fail-open pattern: never throws, returns false if RESEND_API_KEY is missing
// or the request errors, so callers can fire this without risking the thing
// that triggered it (e.g. a registration) on an email hiccup.

// Resend's shared sandbox sender — works out of the box with no domain setup,
// but can only deliver to the email address on the Resend account itself.
// Once a sending domain is verified in Resend, set RESEND_FROM_EMAIL to an
// address on that domain to send to any recipient.
const DEFAULT_FROM = "SpaGo <onboarding@resend.dev>";

let cachedClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new Resend(process.env.RESEND_API_KEY);
  }
  return cachedClient;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  try {
    const { error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[sendEmail] Resend returned an error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sendEmail] request failed:", err);
    return false;
  }
}
