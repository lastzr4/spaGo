import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string; bookingId: string } }
) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "STATUS_INVALID" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status },
  });

  // Cancelling a booking frees its slot back up for other customers.
  if (status === "CANCELLED") {
    await prisma.slot.updateMany({
      where: { id: booking.slotId, status: "BOOKED" },
      data: { status: "AVAILABLE" },
    });
  }

  return NextResponse.json({ booking: updated });
}
