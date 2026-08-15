import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function PATCH(req: NextRequest, { params }: { params: { token: string; slotId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slot = await prisma.slot.findUnique({ where: { id: params.slotId } });
  if (!slot || slot.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status } = body ?? {};
  if (!["AVAILABLE", "BLOCKED"].includes(status)) {
    return NextResponse.json({ error: "status must be AVAILABLE or BLOCKED" }, { status: 400 });
  }

  const updated = await prisma.slot.update({ where: { id: params.slotId }, data: { status } });
  return NextResponse.json({ slot: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { token: string; slotId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slot = await prisma.slot.findUnique({ where: { id: params.slotId } });
  if (!slot || slot.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (slot.status === "BOOKED") return NextResponse.json({ error: "Cannot delete a booked slot" }, { status: 409 });

  await prisma.slot.delete({ where: { id: params.slotId } });
  return NextResponse.json({ ok: true });
}
