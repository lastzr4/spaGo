import { prisma } from "@/lib/prisma";

// A toyyibPay-deposit booking claims its slot(s) immediately on creation —
// that's the "lock" a customer holds while they go pay (see
// app/api/bookings/route.ts). If they never come back to finish paying (no
// callback ever fires — they just closed the tab), that hold would sit
// there forever without this sweep. There's no cron/queue infrastructure
// in this app, so instead this runs opportunistically on every read/write
// path that cares about slot availability: whenever slots are about to be
// shown or claimed, first release anything that's been sitting unpaid past
// the hold window. A booking that DOES get a toyyibPay callback (success
// or failure) is handled immediately by that route instead — this sweep
// only ever catches true abandonment.
export const TOYYIBPAY_HOLD_MINUTES = 15;

export async function releaseExpiredToyyibpayHolds(therapistId?: string) {
  const cutoff = new Date(Date.now() - TOYYIBPAY_HOLD_MINUTES * 60 * 1000);

  const stale = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      toyyibpayPaymentStatus: "PENDING",
      toyyibpayBillCode: { not: null },
      createdAt: { lt: cutoff },
      ...(therapistId ? { therapistId } : {}),
    },
    select: { id: true, slotId: true },
  });
  if (stale.length === 0) return;

  const ids = stale.map((b) => b.id);
  await prisma.booking.updateMany({
    where: { id: { in: ids } },
    data: { status: "CANCELLED", toyyibpayPaymentStatus: "FAILED", cancelledAt: new Date() },
  });
  await prisma.slot.updateMany({
    where: { id: { in: stale.map((b) => b.slotId) }, status: "BOOKED" },
    data: { status: "AVAILABLE" },
  });
  await prisma.slot.updateMany({
    where: { overflowForBookingId: { in: ids }, status: "BOOKED" },
    data: { status: "AVAILABLE", overflowForBookingId: null },
  });
}
