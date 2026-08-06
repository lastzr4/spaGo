import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/DashboardNav";
import ServiceManager from "@/components/ServiceManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const services = await prisma.service.findMany({ where: { therapistId: therapist.id }, orderBy: { createdAt: "asc" } });

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-brand-900">Urus Servis</h1>
      <DashboardNav token={params.token} active="services" />
      <ServiceManager
        token={params.token}
        initialServices={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, price: s.price.toString(), active: s.active, photoUrl: s.photoUrl }))}
      />
    </main>
  );
}
