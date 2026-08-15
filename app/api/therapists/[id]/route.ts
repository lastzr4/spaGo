import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: params.id },
    include: {
      services: { where: { active: true }, orderBy: { price: "asc" } },
    },
  });

  if (!therapist || !therapist.active) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  return NextResponse.json({ therapist });
}
