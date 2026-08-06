import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin } from "@/lib/pin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!username || !pin) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const therapist = await prisma.therapist.findUnique({ where: { username } });

  if (!therapist || !verifyPin(pin, therapist.pinHash)) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  return NextResponse.json({ dashboardToken: therapist.dashboardToken });
}
