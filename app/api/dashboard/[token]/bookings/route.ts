import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookings = await prisma.booking.findMany({
    where: { therapistId: therapist.id },
    include: { service: true, slot: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
