import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallbackHash } from "@/lib/toyyibpay";
import { sendPushToTherapist } from "@/lib/push";

// POST /api/toyyibpay/callback — server-to-server, called by toyyibPay
// itself (not the customer's browser) once a bill's payment status is
// known. Public, no auth — the MD5 hash below is what proves the request
// actually came from toyyibPay, not a session/token.
//
// toyyibPay sends this as a normal form POST (not JSON).
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false }, { status: 400 });

  const status = String(form.get("status") ?? "");
  const orderId = String(form.get("order_id") ?? "");
  const refno = String(form.get("refno") ?? "");
  const hash = String(form.get("hash") ?? "");
  const billcode = String(form.get("billcode") ?? "");

  if (!status || !orderId || !hash) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  // Reject anything that doesn't verify — never trust callback data without
  // checking the hash first, this endpoint has no other auth.
  if (!verifyCallbackHash({ status, orderId, refno, hash })) {
    console.error("[toyyibpay callback] hash mismatch, rejecting", { orderId, billcode });
    return NextResponse.json({ ok: false, error: "Invalid hash" }, { status: 403 });
  }

  // orderId is the booking's own id (set as billExternalReferenceNo when
  // the bill was created) — double check against the stored billCode too,
  // in case order_id was ever tampered with in transit.
  const booking = await prisma.booking.findUnique({ where: { id: orderId }, include: { therapist: true } });
  if (!booking || booking.toyyibpayBillCode !== billcode) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  const paymentStatus = status === "1" ? "PAID" : status === "3" ? "FAILED" : "PENDING";

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      toyyibpayPaymentStatus: paymentStatus,
      toyyibpayPaidAt: paymentStatus === "PAID" ? new Date() : null,
      // Payment failed outright (not just pending) — cancel the hold
      // immediately rather than waiting for the abandonment sweep, and
      // free the slot(s) right back up for other customers.
      ...(paymentStatus === "FAILED" ? { status: "CANCELLED", cancelledAt: new Date() } : {}),
    },
  });

  if (paymentStatus === "FAILED") {
    await prisma.slot.updateMany({ where: { id: booking.slotId, status: "BOOKED" }, data: { status: "AVAILABLE" } });
    await prisma.slot.updateMany({
      where: { overflowForBookingId: booking.id, status: "BOOKED" },
      data: { status: "AVAILABLE", overflowForBookingId: null },
    });
  }

  if (paymentStatus === "PAID") {
    // Fire-and-forget — same fail-open contract as every other push trigger
    // in this codebase, a notification hiccup must never fail the callback.
    sendPushToTherapist(booking.therapist.id, {
      title: "Deposit dibayar",
      body: `${booking.customerName} — deposit dibayar melalui toyyibPay. Sila sahkan tempahan.`,
      url: `/dashboard/${booking.therapist.dashboardToken}/bookings?status=PENDING`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
