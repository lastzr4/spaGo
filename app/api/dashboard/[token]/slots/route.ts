import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");

  const slots = await prisma.slot.findMany({
    where: {
      therapistId: therapist.id,
      ...(from ? { date: { gte: new Date(from) } } : {}),
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}

// Create one or more slots at once.
// { date: "2026-08-10", times: [{ startTime: "10:00", endTime: "11:00" }, ...] }
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { date, times } = body ?? {};
  if (!date || !Array.isArray(times) || times.length === 0) {
    return NextResponse.json({ error: "date and times[] required" }, { status: 400 });
  }

  const created = await prisma.$transaction(
    times.map((t: { startTime: string; endTime: string }) =>
      prisma.slot.upsert({
        where: { therapistId_date_startTime: { therapistId: therapist.id, date: new Date(date), startTime: t.startTime } },
        update: {},
        create: {
          therapistId: therapist.id,
          date: new Date(date),
          startTime: t.startTime,
          endTime: t.endTime,
          status: "AVAILABLE",
        },
      })
    )
  );

  return NextResponse.json({ slots: created }, { status: 201 });
}
