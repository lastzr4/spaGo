import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { isLateCancellation } from "@/lib/cancellation";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string; bookingId: string } }
) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId }, include: { slot: true } });
  if (!booking || booking.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "STATUS_INVALID" }, { status: 400 });
  }

  // Cancellation policy: a CONFIRMED booking cancelled inside the
  // therapist's cancellation window forfeits its deposit as compensation
  // for the therapist's time/travel. Only applies to bookings that were
  // actually CONFIRMED (a PENDING request being declined isn't a
  // "cancellation" in this sense) and that had a deposit collected.
  const isLate =
    status === "CANCELLED" && booking.status === "CONFIRMED"
      ? isLateCancellation(booking.slot.date.toISOString().slice(0, 10), booking.slot.startTime, therapist.cancellationWindowHours)
      : false;
  const shouldForfeit = isLate && booking.depositAmountSnapshot != null && Number(booking.depositAmountSnapshot) > 0;

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status,
      ...(status === "CANCELLED"
        ? {
            cancelledAt: new Date(),
            lateCancellation: isLate,
            depositForfeited: shouldForfeit,
          }
        : {}),
    },
  });

  // Cancelling a booking frees its slot back up for other customers.
  if (status === "CANCELLED") {
    await prisma.slot.updateMany({
      where: { id: booking.slotId, status: "BOOKED" },
      data: { status: "AVAILABLE" },
    });
  }

  return NextResponse.json({ booking: updated, lateCancellation: isLate, depositForfeited: shouldForfeit });
}
