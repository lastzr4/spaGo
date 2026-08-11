import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

// POST /api/dashboard/[token]/bookings/[bookingId]/reschedule
// { newSlotId } — moves a booking to a different slot with no cancellation
// fee/penalty. Old slot is freed back to AVAILABLE, new slot is marked
// BOOKED, and the booking now points at it.
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string; bookingId: string } }
) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    return NextResponse.json({ error: "BOOKING_NOT_RESCHEDULABLE" }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const newSlotId = body?.newSlotId;
  if (!newSlotId || typeof newSlotId !== "string") {
    return NextResponse.json({ error: "NEW_SLOT_REQUIRED" }, { status: 400 });
  }
  if (newSlotId === booking.slotId) {
    return NextResponse.json({ error: "SAME_SLOT" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const newSlot = await tx.slot.findUnique({ where: { id: newSlotId } });
      if (!newSlot || newSlot.therapistId !== therapist.id || newSlot.status !== "AVAILABLE") {
        throw new Error("SLOT_UNAVAILABLE");
      }

      await tx.slot.update({ where: { id: newSlotId }, data: { status: "BOOKED" } });
      await tx.slot.updateMany({ where: { id: booking.slotId, status: "BOOKED" }, data: { status: "AVAILABLE" } });

      return tx.booking.update({ where: { id: booking.id }, data: { slotId: newSlotId } });
    });

    return NextResponse.json({ booking: updated });
  } catch (err: any) {
    const message = err?.message ?? "UNKNOWN_ERROR";
    return NextResponse.json({ error: message }, { status: message === "SLOT_UNAVAILABLE" ? 409 : 500 });
  }
}
