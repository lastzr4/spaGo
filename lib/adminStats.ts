import { prisma } from "@/lib/prisma";

export async function getPlatformStats() {
  const [
    totalTherapists,
    activeTherapists,
    demoTherapists,
    pendingBookings,
    completedBookingsList,
    totalBookings,
    totalReviews,
  ] = await Promise.all([
    prisma.therapist.count({ where: { isDemo: false } }),
    prisma.therapist.count({ where: { isDemo: false, active: true } }),
    prisma.therapist.count({ where: { isDemo: true } }),
    prisma.booking.count({ where: { status: "PENDING", therapist: { isDemo: false } } }),
    prisma.booking.findMany({
      where: { status: "COMPLETED", therapist: { isDemo: false } },
      include: { service: { select: { price: true } } },
    }),
    prisma.booking.count({ where: { therapist: { isDemo: false } } }),
    prisma.review.count({ where: { hidden: false, therapist: { isDemo: false } } }),
  ]);

  const totalRevenue = completedBookingsList.reduce(
    (sum, b) => sum + Number(b.service.price) + Number(b.outcallFee ?? 0),
    0
  );

  return {
    totalTherapists,
    activeTherapists,
    demoTherapists,
    pendingBookings,
    completedBookings: completedBookingsList.length,
    totalBookings,
    totalRevenue,
    totalReviews,
  };
}
