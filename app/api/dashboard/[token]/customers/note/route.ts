import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function PUT(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { phone, note } = body ?? {};
  if (typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const saved = await prisma.customerNote.upsert({
    where: { therapistId_customerPhone: { therapistId: therapist.id, customerPhone: phone } },
    update: { note: typeof note === "string" ? note : null },
    create: { therapistId: therapist.id, customerPhone: phone, note: typeof note === "string" ? note : null },
  });

  return NextResponse.json({ note: saved.note });
}
