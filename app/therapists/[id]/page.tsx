import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingFlow from "@/components/BookingFlow";
import ReviewSection from "@/components/ReviewSection";

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

  const reviews = await prisma.review.findMany({
    where: { therapistId: therapist.id, hidden: false },
    orderBy: { createdAt: "desc" },
  });
  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <Link href={`/therapists?area=${encodeURIComponent(searchParams.area ?? "")}&gender=${customerGender}`} className="mb-4 text-sm text-brand-600">
        &larr; Kembali ke senarai
      </Link>

      <div className="mb-6 flex items-center gap-4">
        {therapist.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={therapist.photoUrl} alt={therapist.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
            {therapist.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-brand-900">{therapist.name}</h1>
          <p className="text-sm text-gray-500">{therapist.coverageAreas.join(", ")}</p>
          {average !== null && (
            <p className="text-xs text-yellow-500">
              {"★".repeat(Math.round(average))}
              <span className="text-gray-300">{"★".repeat(5 - Math.round(average))}</span>{" "}
              <span className="text-gray-400">{average.toFixed(1)} ({reviews.length})</span>
            </p>
          )}
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
            photoUrl: s.photoUrl,
          }))}
          slots={slots.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
          }))}
        />
      </div>

      <div className="mt-8">
        <ReviewSection
          therapistId={therapist.id}
          initialReviews={reviews.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
          }))}
          initialAverage={average}
        />
      </div>
    </main>
  );
}
