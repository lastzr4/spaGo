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

// Malaysia is a fixed UTC+8 offset (no DST). Shifting the current epoch by 8h and
// reading it back via the UTC getters gives Malaysia's wall-clock date/time no
// matter what timezone the runtime itself is in (Railway's server vs. the
// browser). Without this, "today"/"past" comparisons computed during server-side
// render (server TZ) and during client hydration (browser TZ) can disagree —
// which shows up as a slot rendering as available on first load and only
// correcting itself (looking "stuck") after a manual refresh.
function nowInMY() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000);
}

export function todayStr() {
  const d = nowInMY();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Is this HH:MM already in the past, assuming the given calendar date is today?
export function isPastTime(t: string) {
  const d = nowInMY();
  const nowMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m < nowMinutes;
}

// Is this date+time combo already in the past, right now? Anchored explicitly to
// +08:00 so the resulting instant is correct regardless of the server's own TZ.
export function isPastSlot(dateStr: string, time: string) {
  const slot = new Date(`${dateStr.slice(0, 10)}T${time}:00+08:00`);
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
