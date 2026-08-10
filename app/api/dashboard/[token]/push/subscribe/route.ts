import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Upsert on endpoint — re-subscribing the same device (e.g. after
  // clearing permissions and re-granting) just refreshes the row rather
  // than erroring on the unique constraint.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { therapistId: therapist.id, p256dh, auth },
    create: { therapistId: therapist.id, endpoint, p256dh, auth },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, therapistId: therapist.id } });
  return NextResponse.json({ ok: true });
}
