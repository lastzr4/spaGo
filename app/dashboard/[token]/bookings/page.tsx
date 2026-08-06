import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/DashboardNav";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Disahkan",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

export default async function BookingsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const bookings = await prisma.booking.findMany({
    where: { therapistId: therapist.id },
    include: { service: true, slot: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-brand-900">Tempahan</h1>
      <DashboardNav token={params.token} active="bookings" />

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada tempahan lagi.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-center justify-between">
                <p className="font-medium text-brand-900">{b.customerName}</p>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{b.service.name} &middot; {b.slot.date.toISOString().slice(0, 10)} {b.slot.startTime}</p>
              <p className="mt-1 text-xs text-gray-400">{b.customerPhone} &middot; {b.customerAddress}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
