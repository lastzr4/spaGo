import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { isValidBadge } from "@/lib/pricing";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const services = await prisma.service.findMany({ where: { therapistId: therapist.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, durationMinutes, price, description, photoUrl, promoPrice, badge } = body ?? {};
  if (!name || !durationMinutes || price === undefined) {
    return NextResponse.json({ error: "name, durationMinutes, price required" }, { status: 400 });
  }
  if (promoPrice != null && (isNaN(Number(promoPrice)) || Number(promoPrice) <= 0 || Number(promoPrice) >= Number(price))) {
    return NextResponse.json({ error: "PROMO_PRICE_INVALID" }, { status: 400 });
  }
  if (badge != null && !isValidBadge(badge)) {
    return NextResponse.json({ error: "BADGE_INVALID" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      therapistId: therapist.id,
      name,
      durationMinutes,
      price,
      promoPrice: promoPrice != null ? Number(promoPrice) : null,
      badge: badge ?? null,
      description: description ?? null,
      photoUrl: photoUrl ?? null,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}
