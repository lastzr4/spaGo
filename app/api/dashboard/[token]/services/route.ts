import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { isValidBadge } from "@/lib/pricing";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const services = await prisma.service.findMany({
    where: { therapistId: therapist.id },
    orderBy: { createdAt: "asc" },
    include: { packageItems: { select: { id: true, name: true, durationMinutes: true, price: true } } },
  });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, durationMinutes, price, description, photoUrl, promoPrice, badge, isPackage, packageItemIds } = body ?? {};
  if (!name || !durationMinutes || price === undefined) {
    return NextResponse.json({ error: "name, durationMinutes, price required" }, { status: 400 });
  }
  if (promoPrice != null && (isNaN(Number(promoPrice)) || Number(promoPrice) <= 0 || Number(promoPrice) >= Number(price))) {
    return NextResponse.json({ error: "PROMO_PRICE_INVALID" }, { status: 400 });
  }
  if (badge != null && !isValidBadge(badge)) {
    return NextResponse.json({ error: "BADGE_INVALID" }, { status: 400 });
  }

  // A package can only bundle plain (non-package) services belonging to the
  // same therapist — no nesting packages inside packages, and no reaching
  // into another therapist's catalogue.
  let validPackageItemIds: string[] = [];
  if (isPackage && Array.isArray(packageItemIds) && packageItemIds.length) {
    const items = await prisma.service.findMany({
      where: { id: { in: packageItemIds }, therapistId: therapist.id, isPackage: false },
      select: { id: true },
    });
    validPackageItemIds = items.map((i) => i.id);
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
      isPackage: Boolean(isPackage),
      ...(validPackageItemIds.length ? { packageItems: { connect: validPackageItemIds.map((id) => ({ id })) } } : {}),
    },
    include: { packageItems: { select: { id: true, name: true, durationMinutes: true, price: true } } },
  });

  return NextResponse.json({ service }, { status: 201 });
}
