import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function PATCH(req: NextRequest, { params }: { params: { token: string; reviewId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const review = await prisma.review.findUnique({ where: { id: params.reviewId } });
  if (!review || review.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { hidden } = body ?? {};
  if (typeof hidden !== "boolean") {
    return NextResponse.json({ error: "hidden (boolean) required" }, { status: 400 });
  }

  const updated = await prisma.review.update({ where: { id: params.reviewId }, data: { hidden } });
  return NextResponse.json({ review: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { token: string; reviewId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const review = await prisma.review.findUnique({ where: { id: params.reviewId } });
  if (!review || review.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.review.delete({ where: { id: params.reviewId } });
  return NextResponse.json({ ok: true });
}
