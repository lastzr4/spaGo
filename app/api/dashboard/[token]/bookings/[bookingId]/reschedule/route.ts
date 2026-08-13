import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { slotsNeededFor, findConsecutiveAvailableSlots } from "@/lib/slotOverlap";

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

  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId }, include: { service: true } });
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

      // Same "does this service actually fit in one slot" check as booking
      // creation — the therapist could be moving a multi-hour service to a
      // new start time that doesn't have enough consecutive room after it.
      const slotsNeeded = slotsNeededFor(booking.service.durationMinutes);
      let newOverflowIds: string[] = [];
      if (slotsNeeded > 1) {
        const daySlots = await tx.slot.findMany({
          where: { therapistId: therapist.id, date: newSlot.date },
          select: { id: true, date: true, startTime: true, status: true },
        });
        const consecutiveIds = findConsecutiveAvailableSlots(
          daySlots.map((s) => ({ ...s, date: s.date.toISOString() })),
          { id: newSlot.id, date: newSlot.date.toISOString(), startTime: newSlot.startTime },
          slotsNeeded
        );
        if (!consecutiveIds) throw new Error("NOT_ENOUGH_CONSECUTIVE_SLOTS");
        newOverflowIds = consecutiveIds.filter((id) => id !== newSlotId);
      }

      // Free every slot the old booking held — the primary one plus any
      // overflow slots blocked for its old (possibly multi-hour) start time.
      await tx.slot.updateMany({ where: { id: booking.slotId, status: "BOOKED" }, data: { status: "AVAILABLE" } });
      await tx.slot.updateMany({
        where: { overflowForBookingId: booking.id, status: "BOOKED" },
        data: { status: "AVAILABLE", overflowForBookingId: null },
      });

      await tx.slot.update({ where: { id: newSlotId }, data: { status: "BOOKED" } });
      const result = await tx.booking.update({ where: { id: booking.id }, data: { slotId: newSlotId } });

      if (newOverflowIds.length) {
        await tx.slot.updateMany({
          where: { id: { in: newOverflowIds } },
          data: { status: "BOOKED", overflowForBookingId: booking.id },
        });
      }

      return result;
    });

    return NextResponse.json({ booking: updated });
  } catch (err: any) {
    const message = err?.message ?? "UNKNOWN_ERROR";
    const statusMap: Record<string, number> = { SLOT_UNAVAILABLE: 409, NOT_ENOUGH_CONSECUTIVE_SLOTS: 409 };
    return NextResponse.json({ error: message }, { status: statusMap[message] ?? 500 });
  }
}
