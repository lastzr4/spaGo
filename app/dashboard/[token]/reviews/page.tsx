import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
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
    <>
      <TopBar title="Ulasan Pelanggan" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
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
      <BottomTabBar token={params.token} />
    </>
  );
}
