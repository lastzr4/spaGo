import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMatch } from "@/lib/gender";
import { sendPushToTherapist } from "@/lib/push";

// POST /api/bookings
// { therapistId, serviceId, slotId, customerName, customerPhone, customerAddress, customerGender }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { therapistId, serviceId, slotId, customerName, customerPhone, customerAddress, customerGender, referralCodeUsed, customerLat, customerLng } = body ?? {};

  if (!therapistId || !serviceId || !slotId || !customerName || !customerPhone || !customerAddress || !customerGender) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!slot || slot.therapistId !== therapistId || slot.status !== "AVAILABLE") {
        throw new Error("SLOT_UNAVAILABLE");
      }

      const therapist = await tx.therapist.findUnique({ where: { id: therapistId } });
      if (!therapist || !therapist.active) throw new Error("THERAPIST_NOT_FOUND");

      if (!isMatch(customerGender, therapist.gender, therapist.clientGenderPolicy)) {
        throw new Error("GENDER_MISMATCH");
      }

      const service = await tx.service.findUnique({ where: { id: serviceId } });
      if (!service || service.therapistId !== therapistId || !service.active) {
        throw new Error("SERVICE_NOT_FOUND");
      }

      await tx.slot.update({ where: { id: slotId }, data: { status: "BOOKED" } });

      const booking = await tx.booking.create({
        data: {
          therapistId,
          serviceId,
          slotId,
          customerName,
          customerPhone,
          customerAddress,
          customerLat: typeof customerLat === "number" ? customerLat : null,
          customerLng: typeof customerLng === "number" ? customerLng : null,
          customerGender,
          status: "PENDING",
          referralCodeUsed: typeof referralCodeUsed === "string" && referralCodeUsed.trim() ? referralCodeUsed.trim().toUpperCase() : null,
        },
      });

      return { booking, therapist, service, slot };
    });

    // Fire-and-forget — a push failure must never fail the booking itself,
    // same fail-open contract as the registration email notification.
    sendPushToTherapist(result.therapist.id, {
      title: "Tempahan baru!",
      body: `${result.booking.customerName} tempah ${result.service.name} — ${result.slot.startTime}`,
      url: `/dashboard/${result.therapist.dashboardToken}/bookings?status=PENDING`,
    }).catch(() => {});

    return NextResponse.json({ booking: result.booking }, { status: 201 });
  } catch (err: any) {
    const message = err?.message ?? "UNKNOWN_ERROR";
    const statusMap: Record<string, number> = {
      SLOT_UNAVAILABLE: 409,
      THERAPIST_NOT_FOUND: 404,
      SERVICE_NOT_FOUND: 404,
      GENDER_MISMATCH: 403,
    };
    return NextResponse.json({ error: message }, { status: statusMap[message] ?? 500 });
  }
}
