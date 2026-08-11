import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentReceipt } from "@/lib/anthropic";
import { sendPushToTherapist } from "@/lib/push";

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const VERDICT_LABEL: Record<string, string> = {
  LIKELY_VALID: "Nampak sah",
  NEEDS_MANUAL_CHECK: "Perlu semak manual",
  SUSPICIOUS: "Mencurigakan",
};

// POST /api/bookings/[bookingId]/receipt — public, no auth. The booking's
// cuid itself is the access token (same trust model as a therapist's
// dashboardToken): unguessable, and only the customer who just made this
// specific booking would have it (from the success screen / WhatsApp link).
export async function POST(req: NextRequest, { params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { therapist: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const dataUrl: string | undefined = body?.dataUrl;
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return NextResponse.json({ error: "dataUrl required" }, { status: 400 });
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Format fail tidak sah" }, { status: 400 });
  const [, mediaType, base64Data] = match;
  if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return NextResponse.json({ error: "Jenis fail tidak disokong. Guna gambar (JPG/PNG/WEBP)." }, { status: 400 });
  }

  const expectedAmount = booking.depositAmountSnapshot ? Number(booking.depositAmountSnapshot) : 0;
  const verification = await verifyPaymentReceipt({
    base64Data,
    mediaType: mediaType as (typeof ALLOWED_MEDIA_TYPES)[number],
    expectedAmount,
  });

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      depositReceiptUrl: dataUrl,
      depositReceiptUploadedAt: new Date(),
      depositReceiptAiVerdict: verification?.verdict ?? null,
      depositReceiptAiNotes: verification?.notes ?? null,
    },
  });

  // Fire-and-forget — same fail-open contract as every other push trigger.
  sendPushToTherapist(booking.therapist.id, {
    title: "Resit pembayaran diterima",
    body: `${booking.customerName} — ${verification ? VERDICT_LABEL[verification.verdict] : "Sila semak"}. Sahkan di bank/e-wallet anda sebelum terima tempahan.`,
    url: `/dashboard/${booking.therapist.dashboardToken}/bookings?status=PENDING`,
  }).catch(() => {});

  return NextResponse.json({
    verdict: verification?.verdict ?? null,
    notes: verification?.notes ?? "AI tidak dapat menyemak resit ini buat masa ini — sila terus ke WhatsApp dan minta terapis semak manual.",
    receiptUploadedAt: updated.depositReceiptUploadedAt,
  });
}
