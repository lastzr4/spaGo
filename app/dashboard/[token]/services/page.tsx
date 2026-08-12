import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getPendingBookingCount } from "@/lib/dashboardStats";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import ServiceManager from "@/components/ServiceManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const [services, pendingCount] = await Promise.all([
    prisma.service.findMany({
      where: { therapistId: therapist.id },
      orderBy: { createdAt: "asc" },
      include: { packageItems: { select: { id: true, name: true, durationMinutes: true, price: true } } },
    }),
    getPendingBookingCount(therapist.id),
  ]);

  return (
    <>
      <TopBar title="Urus Servis" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <ServiceManager
          token={params.token}
          initialServices={services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price.toString(),
            promoPrice: s.promoPrice ? s.promoPrice.toString() : null,
            badge: s.badge,
            isPackage: s.isPackage,
            packageItems: s.packageItems.map((p) => ({ id: p.id, name: p.name, durationMinutes: p.durationMinutes, price: p.price.toString() })),
            active: s.active,
            photoUrl: s.photoUrl,
            description: s.description,
          }))}
          depositRequired={therapist.depositRequired}
          depositAmount={therapist.depositAmount ? therapist.depositAmount.toString() : null}
          paymentMethod={therapist.paymentMethod}
        />
      </main>
      <BottomTabBar token={params.token} pendingCount={pendingCount} />
    </>
  );
}
