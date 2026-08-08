import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getPendingBookingCount } from "@/lib/dashboardStats";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import SlotManager from "@/components/SlotManager";

export const dynamic = "force-dynamic";

export default async function SlotsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const [slots, pendingCount] = await Promise.all([
    prisma.slot.findMany({
      where: { therapistId: therapist.id, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
      include: { booking: { include: { service: { select: { name: true } } } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    getPendingBookingCount(therapist.id),
  ]);

  return (
    <>
      <TopBar title="Urus Slot Masa" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <SlotManager
          token={params.token}
          initialSlots={slots.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            booking: s.booking
              ? {
                  customerName: s.booking.customerName,
                  customerPhone: s.booking.customerPhone,
                  customerAddress: s.booking.customerAddress,
                  serviceName: s.booking.service.name,
                  status: s.booking.status,
                }
              : null,
          }))}
        />
      </main>
      <BottomTabBar token={params.token} pendingCount={pendingCount} />
    </>
  );
}
