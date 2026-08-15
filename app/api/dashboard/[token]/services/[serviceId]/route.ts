import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { isValidBadge } from "@/lib/pricing";

export async function PATCH(req: NextRequest, { params }: { params: { token: string; serviceId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
    include: { includedInPackages: { select: { id: true } } },
  });
  if (!service || service.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, durationMinutes, price, description, active, photoUrl, promoPrice, badge, isPackage, packageItemIds } = body ?? {};

  // promoPrice must stay a real discount against whichever price will be in
  // effect after this update — the new price if it's being changed in this
  // same request, otherwise the service's existing price.
  const effectiveBasePrice = price !== undefined ? Number(price) : Number(service.price);
  if (promoPrice !== undefined && promoPrice !== null && (isNaN(Number(promoPrice)) || Number(promoPrice) <= 0 || Number(promoPrice) >= effectiveBasePrice)) {
    return NextResponse.json({ error: "PROMO_PRICE_INVALID" }, { status: 400 });
  }
  if (badge !== undefined && badge !== null && !isValidBadge(badge)) {
    return NextResponse.json({ error: "BADGE_INVALID" }, { status: 400 });
  }
  // A service already bundled inside another package can't itself become a
  // package (no nesting) — keeps "Termasuk: ..." lists one level deep.
  if (isPackage === true && service.includedInPackages.length > 0) {
    return NextResponse.json({ error: "ALREADY_PACKAGE_ITEM" }, { status: 400 });
  }

  let packageItemsUpdate = {};
  if (isPackage === true) {
    let validPackageItemIds: string[] = [];
    if (Array.isArray(packageItemIds)) {
      const items = await prisma.service.findMany({
        where: { id: { in: packageItemIds, not: params.serviceId }, therapistId: therapist.id, isPackage: false },
        select: { id: true },
      });
      validPackageItemIds = items.map((i) => i.id);
    }
    packageItemsUpdate = { packageItems: { set: validPackageItemIds.map((id) => ({ id })) } };
  } else if (isPackage === false) {
    packageItemsUpdate = { packageItems: { set: [] } };
  }

  const updated = await prisma.service.update({
    where: { id: params.serviceId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(promoPrice !== undefined ? { promoPrice: promoPrice === null ? null : Number(promoPrice) } : {}),
      ...(badge !== undefined ? { badge } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(isPackage !== undefined ? { isPackage } : {}),
      ...packageItemsUpdate,
    },
    include: { packageItems: { select: { id: true, name: true, durationMinutes: true, price: true } } },
  });

  return NextResponse.json({ service: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { token: string; serviceId: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = await prisma.service.findUnique({ where: { id: params.serviceId } });
  if (!service || service.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.service.delete({ where: { id: params.serviceId } });
  return NextResponse.json({ ok: true });
}
