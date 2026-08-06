import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ therapist });
}

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, phone, gender, clientGenderPolicy, coverageAreas, bio, active } = body ?? {};

  const updated = await prisma.therapist.update({
    where: { id: therapist.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(clientGenderPolicy !== undefined ? { clientGenderPolicy } : {}),
      ...(coverageAreas !== undefined ? { coverageAreas } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });

  return NextResponse.json({ therapist: updated });
}
