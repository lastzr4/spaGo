import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/DashboardNav";
import ReviewModeration from "@/components/ReviewModeration";

export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const reviews = await prisma.review.findMany({
    where: { therapistId: therapist.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-brand-900">Ulasan Pelanggan</h1>
      <DashboardNav token={params.token} active="reviews" />
      <ReviewModeration
        token={params.token}
        initialReviews={reviews.map((r) => ({
          id: r.id,
          customerName: r.customerName,
          rating: r.rating,
          comment: r.comment,
          hidden: r.hidden,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
