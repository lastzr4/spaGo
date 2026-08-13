// Shared "does this service fit in one slot, or does it need several
// consecutive ones?" logic — used both client-side (BookingFlow greys out
// start times that don't have enough room) and server-side (booking
// creation recomputes and enforces the same thing, never trusting the
// client's slotId alone). Every Slot in this app is a generic fixed 1-hour
// block starting on the hour (see lib/slotTimes.ts TIME_GROUPS) — no slot
// is ever a different length — so "N consecutive slots" always just means
// N back-to-back hour marks on the same date.

export function slotsNeededFor(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / 60));
}

// `status` is optional: the client only ever fetches/passes AVAILABLE slots
// in the first place, so a slot present in that list with no status field
// is treated as available. Server-side callers pass every slot for the day
// (any status) so the check there is meaningful.
type SlotLike = { id: string; date: string; startTime: string; status?: string };

// Given the full set of slots the caller already has (any dates/statuses),
// and a candidate start slot, returns the ids of `count` consecutive
// same-day AVAILABLE slots starting at that slot (the slot itself plus the
// following count-1 hour marks), in order — or null if there isn't enough
// contiguous room (a gap, a BOOKED/BLOCKED slot, or the day just ends).
export function findConsecutiveAvailableSlots(allSlots: SlotLike[], startSlot: SlotLike, count: number): string[] | null {
  if (count <= 1) return [startSlot.id];

  const sameDay = allSlots.filter((s) => s.date.slice(0, 10) === startSlot.date.slice(0, 10));
  const byStart = new Map(sameDay.map((s) => [s.startTime, s]));
  const startHour = Number(startSlot.startTime.split(":")[0]);

  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = `${String(startHour + i).padStart(2, "0")}:00`;
    const slot = byStart.get(t);
    if (!slot || (slot.status !== undefined && slot.status !== "AVAILABLE")) return null;
    ids.push(slot.id);
  }
  return ids;
}
