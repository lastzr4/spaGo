import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import { CalendarIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Disahkan",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  CONFIRMED: "bg-brand-50 text-brand-600",
  CANCELLED: "bg-red-50 text-red-500",
  COMPLETED: "bg-emerald-50 text-emerald-600",
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
    <>
      <TopBar title="Tempahan" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        {bookings.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <CalendarIcon className="h-8 w-8 text-brand-200" />
            <p className="text-sm text-gray-500">Belum ada tempahan lagi.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b, i) => (
              <div key={b.id} className="card card-tap animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-900">{b.customerName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status] ?? "bg-gray-50 text-gray-500"}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-gray-600">{b.service.name} &middot; {b.slot.date.toISOString().slice(0, 10)} {b.slot.startTime}</p>
                <p className="mt-1 text-xs text-gray-400">{b.customerPhone} &middot; {b.customerAddress}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomTabBar token={params.token} />
    </>
  );
}
