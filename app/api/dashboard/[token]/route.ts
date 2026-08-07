import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { hashPin, isValidUsername, isValidPin } from "@/lib/pin";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ therapist });
}

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    name, phone, gender, clientGenderPolicy, coverageAreas, bio, active, photoUrl, username, pin,
    depositRequired, depositAmount, paymentMethod, qrCodeUrl, extraChargesNote,
    socialInstagram, socialTiktok, socialThreads, socialX,
  } = body ?? {};

  if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== "QR" && paymentMethod !== "CASH") {
    return NextResponse.json({ error: "PAYMENT_METHOD_INVALID" }, { status: 400 });
  }
  if (depositAmount !== undefined && depositAmount !== null && (isNaN(Number(depositAmount)) || Number(depositAmount) < 0)) {
    return NextResponse.json({ error: "DEPOSIT_AMOUNT_INVALID" }, { status: 400 });
  }

  if (username !== undefined && username !== therapist.username) {
    if (!isValidUsername(username)) {
      return NextResponse.json({ error: "USERNAME_INVALID" }, { status: 400 });
    }
    const taken = await prisma.therapist.findUnique({ where: { username }, select: { id: true } });
    if (taken && taken.id !== therapist.id) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
  }

  if (pin !== undefined && pin !== "" && !isValidPin(pin)) {
    return NextResponse.json({ error: "PIN_INVALID" }, { status: 400 });
  }

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
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(username !== undefined ? { username } : {}),
      ...(pin !== undefined && pin !== "" ? { pinHash: hashPin(pin) } : {}),
      ...(depositRequired !== undefined ? { depositRequired } : {}),
      ...(depositAmount !== undefined ? { depositAmount: depositAmount === null ? null : Number(depositAmount) } : {}),
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      ...(qrCodeUrl !== undefined ? { qrCodeUrl } : {}),
      ...(extraChargesNote !== undefined ? { extraChargesNote } : {}),
      ...(socialInstagram !== undefined ? { socialInstagram: socialInstagram || null } : {}),
      ...(socialTiktok !== undefined ? { socialTiktok: socialTiktok || null } : {}),
      ...(socialThreads !== undefined ? { socialThreads: socialThreads || null } : {}),
      ...(socialX !== undefined ? { socialX: socialX || null } : {}),
    },
  });

  return NextResponse.json({ therapist: updated });
}
