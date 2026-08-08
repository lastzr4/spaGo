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
  // Fetch a small window of candidates rather than just the first — the single
  // nearest-by-date row could technically already be finished earlier today,
  // so we walk forward until we find one that hasn't wrapped up yet.
  const candidates = await prisma.booking.findMany({
    where: {
      therapistId,
      status: "CONFIRMED",
      slot: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
    },
    include: { service: { select: { name: true, durationMinutes: true } }, slot: true },
    orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
    take: 5,
  });

  const now = Date.now();
  for (const booking of candidates) {
    const dateStr = booking.slot.date.toISOString().slice(0, 10);
    // Slot times are stored as plain "HH:mm" and mean Malaysia time (UTC+8);
    // anchor explicitly so this is correct regardless of the server's own TZ.
    const slotInstant = new Date(`${dateStr}T${booking.slot.startTime}:00+08:00`);
    const minutesUntil = Math.round((slotInstant.getTime() - now) / 60000);
    if (minutesUntil >= -30) {
      return {
        id: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerAddress: booking.customerAddress,
        serviceName: booking.service.name,
        durationMinutes: booking.service.durationMinutes,
        date: dateStr,
        startTime: booking.slot.startTime,
        minutesUntil,
      };
    }
  }
  return null;
}
