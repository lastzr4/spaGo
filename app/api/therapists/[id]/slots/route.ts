import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredToyyibpayHolds } from "@/lib/bookingHold";

// GET /api/therapists/:id/slots?from=2026-08-06&to=2026-08-13
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Release any toyyibPay holds this therapist's customers abandoned
  // without completing payment, before showing what's actually available.
  await releaseExpiredToyyibpayHolds(params.id);

  const slots = await prisma.slot.findMany({
    where: {
      therapistId: params.id,
      status: "AVAILABLE",
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}
