import { prisma } from "@/lib/prisma";

export type CustomerSummary = {
  phone: string;
  name: string;
  totalBookings: number;
  completedBookings: number;
  lastBookingDate: string;
  lastServiceName: string;
  referralCode: string;
  daysSinceLast: number;
  needsFollowUp: boolean;
  note: string | null;
};

// Deterministic referral code — there's no customer account system in SpaGo,
// so codes can't be stored/issued; they're derived from name + phone so the
// same customer always gets the same code to share with friends.
export function buildReferralCode(name: string, phone: string) {
  const namePart = (name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "SPA").toUpperCase();
  const phonePart = phone.replace(/\D/g, "").slice(-4) || "0000";
  return `${namePart}${phonePart}`;
}

const FOLLOW_UP_DAYS = 45;

export async function getCustomerSummaries(therapistId: string): Promise<CustomerSummary[]> {
  const [bookings, notes] = await Promise.all([
    prisma.booking.findMany({
      where: { therapistId },
      select: {
        customerName: true,
        customerPhone: true,
        status: true,
        slot: { select: { date: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.customerNote.findMany({ where: { therapistId } }),
  ]);

  const noteMap = new Map<string, string | null>(notes.map((n) => [n.customerPhone, n.note as string | null]));

  const map = new Map<
    string,
    { phone: string; name: string; totalBookings: number; completedBookings: number; lastBookingDate: string; lastServiceName: string }
  >();

  for (const b of bookings) {
    const dateStr = b.slot.date.toISOString().slice(0, 10);
    const existing = map.get(b.customerPhone);
    if (!existing) {
      map.set(b.customerPhone, {
        phone: b.customerPhone,
        name: b.customerName,
        totalBookings: 1,
        completedBookings: b.status === "COMPLETED" ? 1 : 0,
        lastBookingDate: dateStr,
        lastServiceName: b.service.name,
      });
    } else {
      existing.totalBookings += 1;
      if (b.status === "COMPLETED") existing.completedBookings += 1;
      if (dateStr > existing.lastBookingDate) {
        existing.lastBookingDate = dateStr;
        existing.lastServiceName = b.service.name;
        existing.name = b.customerName;
      }
    }
  }

  const now = Date.now();
  return Array.from(map.values())
    .map((c) => {
      const daysSinceLast = Math.floor(
        (now - new Date(`${c.lastBookingDate}T00:00:00+08:00`).getTime()) / 86400000
      );
      return {
        ...c,
        referralCode: buildReferralCode(c.name, c.phone),
        daysSinceLast,
        needsFollowUp: c.completedBookings > 0 && daysSinceLast > FOLLOW_UP_DAYS,
        note: noteMap.get(c.phone) ?? null,
      };
    })
    .sort((a, b) => (a.lastBookingDate < b.lastBookingDate ? 1 : -1));
}
