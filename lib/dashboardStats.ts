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
        where: {
          therapistId,
          status: "CONFIRMED",
          slot: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
        },
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

// Daily sales total (completed bookings, keyed by the slot's service date —
// not booking creation date, so a booking counts on the day the service was
// actually delivered) for the last `days` days, zero-filled so the sparkline
// in SalesHeroCard always has a full-width series to draw.
export async function getSalesTrend(therapistId: string, days = 7) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const bookings = await prisma.booking.findMany({
    where: { therapistId, status: "COMPLETED", slot: { date: { gte: since } } },
    include: { service: { select: { price: true } }, slot: { select: { date: true } } },
  });

  const byDate = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDate.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of bookings) {
    const dateStr = b.slot.date.toISOString().slice(0, 10);
    if (byDate.has(dateStr)) {
      byDate.set(dateStr, (byDate.get(dateStr) ?? 0) + Number(b.service.price) + Number(b.outcallFee ?? 0));
    }
  }

  return Array.from(byDate.entries()).map(([date, total]) => ({ date, total }));
}

// Most recent completed bookings, newest service-date first — powers the
// "Transaksi Terkini" list on the dashboard home.
export async function getRecentTransactions(therapistId: string, limit = 5) {
  const bookings = await prisma.booking.findMany({
    where: { therapistId, status: "COMPLETED" },
    include: { service: { select: { name: true, price: true } }, slot: { select: { date: true } } },
    orderBy: [{ slot: { date: "desc" } }],
    take: limit,
  });

  return bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    serviceName: b.service.name,
    date: b.slot.date.toISOString().slice(0, 10),
    amount: Number(b.service.price) + Number(b.outcallFee ?? 0),
  }));
}

export async function getUpcomingQueue(therapistId: string, limit = 8) {
  // Every confirmed booking from today onward, soonest first — powers the
  // "Giliran Akan Datang" queue.
  const bookings = await prisma.booking.findMany({
    where: {
      therapistId,
      status: "CONFIRMED",
      slot: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
    },
    include: { service: { select: { name: true, durationMinutes: true } }, slot: true },
    orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
    take: limit,
  });

  const now = Date.now();
  // Note: we deliberately do NOT filter out "already past" bookings here —
  // the WHERE clause above already limits to today-or-later by date, and
  // minutesUntil is only used for "due soon" styling below, not exclusion.
  // Being extra clever about excluding same-day-but-passed bookings caused
  // this list to silently disappear even when the Ringkasan stat still
  // counted the booking as upcoming.
  return bookings.map((booking) => {
    const dateStr = booking.slot.date.toISOString().slice(0, 10);
    // Slot times are stored as plain "HH:mm" and mean Malaysia time (UTC+8);
    // anchor explicitly so this is correct regardless of the server's own TZ.
    const slotInstant = new Date(`${dateStr}T${booking.slot.startTime}:00+08:00`);
    const minutesUntil = Math.round((slotInstant.getTime() - now) / 60000);
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
  });
}

export type ScheduleConflict = {
  date: string;
  firstCustomerName: string;
  firstEndTime: string;
  secondCustomerName: string;
  secondStartTime: string;
  gapMinutes: number;
};

// Flags same-day CONFIRMED bookings that leave too little time between one
// job's end and the next one's start. This is an honest, buildable warning —
// NOT real distance-based route optimization (that would need a
// geocoding/Maps Distance Matrix API, which SpaGo doesn't have yet).
const CONFLICT_BUFFER_MINUTES = 45;

export async function getScheduleConflicts(therapistId: string): Promise<ScheduleConflict[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      therapistId,
      status: "CONFIRMED",
      slot: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
    },
    select: { customerName: true, slot: { select: { date: true, startTime: true, endTime: true } } },
  });

  const byDate = new Map<string, { customerName: string; startTime: string; endTime: string }[]>();
  for (const b of bookings) {
    const dateStr = b.slot.date.toISOString().slice(0, 10);
    const list = byDate.get(dateStr) ?? [];
    list.push({ customerName: b.customerName, startTime: b.slot.startTime, endTime: b.slot.endTime });
    byDate.set(dateStr, list);
  }

  const conflicts: ScheduleConflict[] = [];

  for (const [date, list] of byDate) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < list.length - 1; i++) {
      const current = list[i];
      const next = list[i + 1];
      // Anchor explicitly to Malaysia time (+08:00) — plain "HH:mm" strings
      // mean nothing without a timezone, and the server may not run in MYT.
      const currentEnd = new Date(`${date}T${current.endTime}:00+08:00`).getTime();
      const nextStart = new Date(`${date}T${next.startTime}:00+08:00`).getTime();
      const gapMinutes = Math.round((nextStart - currentEnd) / 60000);
      if (gapMinutes < CONFLICT_BUFFER_MINUTES) {
        conflicts.push({
          date,
          firstCustomerName: current.customerName,
          firstEndTime: current.endTime,
          secondCustomerName: next.customerName,
          secondStartTime: next.startTime,
          gapMinutes,
        });
      }
    }
  }

  return conflicts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
