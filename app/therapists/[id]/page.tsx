import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingFlow from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export default async function TherapistDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { area?: string; gender?: string };
}) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: params.id },
    include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
  });

  if (!therapist || !therapist.active) notFound();

  const today = new Date();
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(today.getDate() + 14);

  const slots = await prisma.slot.findMany({
    where: {
      therapistId: therapist.id,
      status: "AVAILABLE",
      date: { gte: today, lte: twoWeeksOut },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const customerGender = (searchParams.gender as "MALE" | "FEMALE") ?? "FEMALE";

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <Link href={`/therapists?area=${encodeURIComponent(searchParams.area ?? "")}&gender=${customerGender}`} className="mb-4 text-sm text-brand-600">
        &larr; Kembali ke senarai
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
          {therapist.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-brand-900">{therapist.name}</h1>
          <p className="text-sm text-gray-500">{therapist.coverageAreas.join(", ")}</p>
        </div>
      </div>

      {therapist.bio && <p className="mb-6 text-sm text-gray-600">{therapist.bio}</p>}

      <div className="card">
        <BookingFlow
          therapistId={therapist.id}
          therapistPhone={therapist.phone}
          customerGender={customerGender}
          services={therapist.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price.toString(),
          }))}
          slots={slots.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
          }))}
        />
      </div>
    </main>
  );
}
