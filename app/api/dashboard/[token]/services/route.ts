import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const services = await prisma.service.findMany({ where: { therapistId: therapist.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, durationMinutes, price, description } = body ?? {};
  if (!name || !durationMinutes || price === undefined) {
    return NextResponse.json({ error: "name, durationMinutes, price required" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: { therapistId: therapist.id, name, durationMinutes, price, description: description ?? null },
  });

  return NextResponse.json({ service }, { status: 201 });
}
