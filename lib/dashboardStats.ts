import { prisma } from "@/lib/prisma";

export async function getDashboardStats(therapistId: string) {
  const [completedBookings, pendingCount, confirmedUpcoming, activeServicesCount, reviewAgg, reviews] =
    await Promise.all([
      prisma.booking.findMany({
        where: { therapistId, status: "COMPLETED" },
        include: { service: { select: { price: true } } },
      }),
      prisma.booking.count({ where: { therapistId, status: "PENDING" } }),
      prisma.booking.count({
        where: { therapistId, status: "CONFIRMED", slot: { date: { gte: new Date() } } },
      }),
      prisma.service.count({ where: { therapistId, active: true } }),
      prisma.review.aggregate({ where: { therapistId, hidden: false }, _avg: { rating: true } }),
      prisma.review.count({ where: { therapistId, hidden: false } }),
    ]);

  const customersServed = completedBookings.length;
  const totalCollected = completedBookings.reduce(
    (sum, b) => sum + Number(b.service.price) + Number(b.outcallFee ?? 0),
    0
  );

  return {
    customersServed,
    totalCollected,
    pendingCount,
    confirmedUpcoming,
    activeServicesCount,
    averageRating: reviewAgg._avg.rating,
    reviewCount: reviews,
  };
}

export async function getPendingBookingCount(therapistId: string) {
  return prisma.booking.count({ where: { therapistId, status: "PENDING" } });
}

export async function getNextUpcomingBooking(therapistId: string) {
  const booking = await prisma.booking.findFirst({
    where: { therapistId, status: "CONFIRMED", slot: { date: { gte: new Date() } } },
    include: { service: { select: { name: true } }, slot: true },
    orderBy: { slot: { date: "asc" } },
  });

  if (!booking) return null;

  return {
    customerName: booking.customerName,
    serviceName: booking.service.name,
    date: booking.slot.date.toISOString().slice(0, 10),
    startTime: booking.slot.startTime,
  };
}
