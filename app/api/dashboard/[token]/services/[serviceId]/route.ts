import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function PATCH(req: NextRequest, { params }: { params: { token: string; serviceId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = await prisma.service.findUnique({ where: { id: params.serviceId } });
  if (!service || service.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, durationMinutes, price, description, active } = body ?? {};

  const updated = await prisma.service.update({
    where: { id: params.serviceId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });

  return NextResponse.json({ service: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { token: string; serviceId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = await prisma.service.findUnique({ where: { id: params.serviceId } });
  if (!service || service.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.service.delete({ where: { id: params.serviceId } });
  return NextResponse.json({ ok: true });
}
