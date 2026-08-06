import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import BookingList from "@/components/BookingList";

export const dynamic = "force-dynamic";

export default async function BookingsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const bookings = await prisma.booking.findMany({
    where: { therapistId: therapist.id },
    include: { service: true, slot: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopBar title="Tempahan" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <BookingList
          token={params.token}
          initialBookings={bookings.map((b) => ({
            id: b.id,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            customerAddress: b.customerAddress,
            status: b.status,
            serviceName: b.service.name,
            date: b.slot.date.toISOString().slice(0, 10),
            startTime: b.slot.startTime,
          }))}
        />
      </main>
      <BottomTabBar token={params.token} />
    </>
  );
}
