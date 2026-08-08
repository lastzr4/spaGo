// Shared time-of-day helpers used by both the manual slot picker (SlotManager)
// and the weekly recurring template editor (SlotTemplateEditor), so the two stay
// visually and behaviourally consistent.

export const TIME_GROUPS: { label: string; times: string[] }[] = [
  { label: "Pagi", times: ["09:00", "10:00", "11:00"] },
  { label: "Petang", times: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"] },
  { label: "Malam", times: ["19:00", "20:00", "21:00", "22:00", "23:00"] },
];

export function timeOfDay(t: string) {
  const h = Number(t.split(":")[0]);
  if (h < 12) return "pagi";
  if (h < 19) return "petang";
  return "malam";
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Is this HH:MM already in the past, assuming the given calendar date is today?
export function isPastTime(t: string) {
  const now = new Date();
  const [h, m] = t.split(":").map(Number);
  const slot = new Date();
  slot.setHours(h, m, 0, 0);
  return slot.getTime() < now.getTime();
}

// Is this date+time combo already in the past, right now?
export function isPastSlot(dateStr: string, time: string) {
  const slot = new Date(`${dateStr.slice(0, 10)}T${time}:00`);
  return slot.getTime() < Date.now();
}

export const WEEKDAYS = [
  { key: "1", label: "Isnin" },
  { key: "2", label: "Selasa" },
  { key: "3", label: "Rabu" },
  { key: "4", label: "Khamis" },
  { key: "5", label: "Jumaat" },
  { key: "6", label: "Sabtu" },
  { key: "0", label: "Ahad" },
];
