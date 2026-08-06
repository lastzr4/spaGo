import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import ServiceManager from "@/components/ServiceManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const services = await prisma.service.findMany({ where: { therapistId: therapist.id }, orderBy: { createdAt: "asc" } });

  return (
    <>
      <TopBar title="Urus Servis" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <ServiceManager
          token={params.token}
          initialServices={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, price: s.price.toString(), active: s.active, photoUrl: s.photoUrl }))}
        />
      </main>
      <BottomTabBar token={params.token} />
    </>
  );
}
