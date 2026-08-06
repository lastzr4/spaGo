import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/DashboardNav";
import SlotManager from "@/components/SlotManager";

export const dynamic = "force-dynamic";

export default async function SlotsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const slots = await prisma.slot.findMany({
    where: { therapistId: therapist.id, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-brand-900">Urus Slot Masa</h1>
      <DashboardNav token={params.token} active="slots" />
      <SlotManager
        token={params.token}
        initialSlots={slots.map((s) => ({ id: s.id, date: s.date.toISOString(), startTime: s.startTime, endTime: s.endTime, status: s.status }))}
      />
    </main>
  );
}
