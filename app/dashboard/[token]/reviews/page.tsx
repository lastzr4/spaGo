import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getPendingBookingCount } from "@/lib/dashboardStats";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import ReviewModeration from "@/components/ReviewModeration";
import ReviewSummaryPanel from "@/components/ReviewSummaryPanel";

export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const [reviews, pendingCount] = await Promise.all([
    prisma.review.findMany({
      where: { therapistId: therapist.id },
      orderBy: { createdAt: "desc" },
    }),
    getPendingBookingCount(therapist.id),
  ]);

  return (
    <>
      <TopBar title="Ulasan Pelanggan" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <ReviewSummaryPanel
          token={params.token}
          initialSummary={therapist.reviewSummary ?? null}
          reviewCount={reviews.filter((r) => !r.hidden).length}
        />
        <ReviewModeration
          token={params.token}
          initialReviews={reviews.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            rating: r.rating,
            comment: r.comment,
            hidden: r.hidden,
            aiFlagged: r.aiFlagged,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </main>
      <BottomTabBar token={params.token} pendingCount={pendingCount} />
    </>
  );
}
