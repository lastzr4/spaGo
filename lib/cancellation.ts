// Same "plain HH:mm string means Malaysia time" anchoring pattern used
// elsewhere (see isOverdue in BookingList.tsx, getScheduleConflicts in
// dashboardStats.ts) — the server's own timezone must never factor in.
export function isLateCancellation(date: string, startTime: string, windowHours: number, now: Date = new Date()): boolean {
  const slotInstant = new Date(`${date}T${startTime}:00+08:00`);
  const hoursUntilSlot = (slotInstant.getTime() - now.getTime()) / 3600000;
  // Negative (slot already started/passed) counts as late too — cancelling
  // after the fact is at least as disruptive as cancelling right before it.
  return hoursUntilSlot < windowHours;
}
