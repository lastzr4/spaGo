import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
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
    <>
      <TopBar title="Urus Slot Masa" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <SlotManager
          token={params.token}
          initialSlots={slots.map((s) => ({ id: s.id, date: s.date.toISOString(), startTime: s.startTime, endTime: s.endTime, status: s.status }))}
        />
      </main>
      <BottomTabBar token={params.token} />
    </>
  );
}
