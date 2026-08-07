import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { active } = body ?? {};
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const therapist = await prisma.therapist.update({
    where: { id: params.id },
    data: { active },
  });

  return NextResponse.json({ therapist });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await prisma.therapist.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
