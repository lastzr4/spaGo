import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getPendingBookingCount } from "@/lib/dashboardStats";
import { generateTemplateSlots } from "@/lib/slotTemplate";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import SlotManager from "@/components/SlotManager";

export const dynamic = "force-dynamic";

export default async function SlotsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  // Extend the rolling template window (idempotent — no-op if already up to date).
  await generateTemplateSlots(therapist.id);

  const [slots, pendingCount] = await Promise.all([
    prisma.slot.findMany({
      where: { therapistId: therapist.id, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
      // A slot can have multiple Booking rows over its lifetime (e.g. one
      // cancelled, then rebooked) — only the current non-cancelled one, if
      // any, represents what's actually occupying the slot right now.
      include: {
        bookings: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { service: { select: { name: true } } },
        },
      },
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
          initialTemplate={(therapist.weeklyTemplate as Record<string, string[]> | null) ?? null}
          initialSlots={slots.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            booking: s.bookings[0]
              ? {
                  customerName: s.bookings[0].customerName,
                  customerPhone: s.bookings[0].customerPhone,
                  customerAddress: s.bookings[0].customerAddress,
                  serviceName: s.bookings[0].service.name,
                  status: s.bookings[0].status,
                }
              : null,
          }))}
        />
      </main>
      <BottomTabBar token={params.token} pendingCount={pendingCount} />
    </>
  );
}
