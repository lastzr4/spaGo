import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";
import { hashPin, isValidPin } from "@/lib/pin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { active, pin } = body ?? {};

  if (active === undefined && pin === undefined) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  if (active !== undefined && typeof active !== "boolean") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  // Admin-assisted PIN reset — the only recovery path for a therapist who's
  // lost both their username/PIN and their dashboard link bookmark. Admin
  // already has unilateral control over every therapist account (activate/
  // deactivate/delete), so granting this too doesn't cross a new trust
  // boundary. Reuses the exact same hashing helper as self-service PIN
  // changes (lib/pin.ts) so the stored hash format is identical either way.
  if (pin !== undefined && !isValidPin(pin)) {
    return NextResponse.json({ error: "PIN_INVALID" }, { status: 400 });
  }

  const therapist = await prisma.therapist.update({
    where: { id: params.id },
    data: {
      ...(active !== undefined ? { active } : {}),
      ...(pin !== undefined ? { pinHash: hashPin(pin) } : {}),
    },
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
