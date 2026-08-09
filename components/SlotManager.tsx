"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, UndoIcon, XIcon, PhoneIcon, MapPinIcon, BriefcaseIcon } from "@/components/icons";
import { TIME_GROUPS, timeOfDay, todayStr, isPastTime, isPastSlot } from "@/lib/slotTimes";
import SlotTemplateEditor from "@/components/SlotTemplateEditor";
import DateStrip, { type DayPill } from "@/components/DateStrip";

type BookingInfo = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceName: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
};

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
  booking?: BookingInfo | null;
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Pengesahan",
  CONFIRMED: "Disahkan",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const BOOKING_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  CONFIRMED: "bg-brand-50 text-brand-600",
  CANCELLED: "bg-red-50 text-red-500",
  COMPLETED: "bg-emerald-50 text-emerald-600",
};

// Slot chip colors when the slot is BOOKED, keyed by the underlying booking's status —
// e.g. a completed appointment shows green ("berjaya"), a still-pending one shows amber.
const BOOKING_CHIP_STYLE: Record<string, string> = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-700",
  CONFIRMED: "border-brand-300 bg-brand-50 text-brand-700",
  COMPLETED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-300 bg-red-50 text-red-600",
};

const WEEKDAY_LABEL = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH_LABEL = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
const STRIP_DAYS = 14;

// Pure UTC-calendar arithmetic — mixing a local-time parse with a UTC-output
// format (toISOString) silently shifts the date by a day in positive-offset
// timezones like Malaysia's, so this avoids local-time parsing entirely.
function addDaysStr(base: string, n: number) {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function formatDateLabel(d: string) {
  const date = new Date(d + "T00:00:00");
  if (d === todayStr()) return "Hari ini";
  if (d === addDaysStr(todayStr(), 1)) return "Esok";
  return `${WEEKDAY_LABEL[date.getDay()]}, ${date.getDate()} ${MONTH_LABEL[date.getMonth()]}`;
}

function formatDateShort(d: string) {
  const date = new Date(d + "T00:00:00");
  if (d === todayStr()) return "Hari ini";
  if (d === addDaysStr(todayStr(), 1)) return "Esok";
  return `${WEEKDAY_LABEL[date.getDay()]} ${date.getDate()}`;
}

function groupByTimeOfDay(daySlots: Slot[]) {
  const map: Record<"pagi" | "petang" | "malam", Slot[]> = { pagi: [], petang: [], malam: [] };
  for (const s of daySlots) map[timeOfDay(s.startTime) as "pagi" | "petang" | "malam"].push(s);
  return map;
}

export default function SlotManager({
  token,
  initialSlots,
  initialTemplate,
}: {
  token: string;
  initialSlots: Slot[];
  initialTemplate: Record<string, string[]> | null;
}) {
  const [slots, setSlots] = useState(initialSlots);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [detailSlot, setDetailSlot] = useState<Slot | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);

  function selectDay(d: string) {
    setSelectedDate(d);
    handleDateChange(d); // keep the manual add-form date in sync with what you're viewing
  }

  function toggleTime(t: string) {
    if (date === todayStr() && isPastTime(t)) return;
    setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function handleDateChange(newDate: string) {
    setDate(newDate);
    // Drop any already-picked times that fall in the past once the date resolves to today.
    if (newDate === todayStr()) {
      setTimes((prev) => prev.filter((t) => !isPastTime(t)));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!date || times.length === 0) return;
    setSaving(true);
    const res = await fetch(`/api/dashboard/${token}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        times: times.map((t) => {
          const [h, m] = t.split(":").map(Number);
          const endH = (h + 1) % 24;
          return { startTime: t, endTime: `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
        }),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSlots((s) => [...s, ...data.slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)));
      setTimes([]);
    }
    setSaving(false);
  }

  async function blockSlot(slot: Slot) {
    const nextStatus = slot.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
    const res = await fetch(`/api/dashboard/${token}/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) setSlots((list) => list.map((s) => (s.id === slot.id ? { ...s, status: nextStatus } : s)));
  }

  async function removeSlot(id: string) {
    const res = await fetch(`/api/dashboard/${token}/slots/${id}`, { method: "DELETE" });
    if (res.ok) setSlots((list) => list.filter((s) => s.id !== id));
  }

  const upcoming = slots.filter((s) => s.date.slice(0, 10) >= todayStr());
  const grouped: Record<string, Slot[]> = {};
  for (const s of upcoming) {
    const d = s.date.slice(0, 10);
    grouped[d] = grouped[d] ? [...grouped[d], s] : [s];
  }

  const STATUS_STYLE = {
    BOOKED: "border-brand-300 bg-brand-50 text-brand-700",
    BLOCKED: "border-black/[0.06] bg-gray-100 text-gray-400",
    AVAILABLE: "border-black/[0.06] bg-white text-gray-600",
  } as const;

  // Rolling 14-day strip, always shown regardless of whether a day has slots yet.
  const stripDays: DayPill[] = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const d = addDaysStr(todayStr(), i);
    const daySlots = grouped[d] ?? [];
    return {
      date: d,
      label: formatDateShort(d),
      hasSlots: daySlots.length > 0,
      hasBooking: daySlots.some((s) => s.status === "BOOKED"),
    };
  });

  const selectedDaySlots = grouped[selectedDate] ?? [];
  const byTod = groupByTimeOfDay(selectedDaySlots);

  // Every future booked slot, across all days, soonest first — answers "who's booked in advance".
  const upcomingBookings = upcoming
    .filter((s) => s.status === "BOOKED" && s.booking && !isPastSlot(s.date, s.startTime))
    .sort((a, b) => (a.date.slice(0, 10) + a.startTime).localeCompare(b.date.slice(0, 10) + b.startTime));
  const visibleBookings = showAllBookings ? upcomingBookings : upcomingBookings.slice(0, 5);

  function renderRow(s: Slot) {
    const past = isPastSlot(s.date, s.startTime);
    if (s.status === "BOOKED" && s.booking) {
      return (
        <button
          key={s.id}
          type="button"
          onClick={() => setDetailSlot(s)}
          className={`card-tap flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            BOOKING_CHIP_STYLE[s.booking.status] ?? STATUS_STYLE.BOOKED
          }`}
        >
          <span className="font-semibold">{s.startTime}</span>
          <span className="truncate">{s.booking.customerName}</span>
        </button>
      );
    }
    return (
      <div
        key={s.id}
        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
          past ? "border-black/[0.06] bg-gray-50 text-gray-300" : STATUS_STYLE[s.status]
        }`}
      >
        <span className="flex items-center gap-2">
          {s.startTime}
          {(past || s.status === "BLOCKED") && <span className="text-[10px] uppercase opacity-70">{past ? "Lepas" : "Ditutup"}</span>}
        </span>
        <span className="flex items-center gap-3">
          {!past && (
            <button onClick={() => blockSlot(s)} className="text-brand-400 active:opacity-60">
              {s.status === "BLOCKED" ? <UndoIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
            </button>
          )}
          <button onClick={() => removeSlot(s.id)} className={`active:opacity-60 ${past ? "text-gray-300" : "text-red-400"}`}>
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SlotTemplateEditor token={token} initialTemplate={initialTemplate} />

      {upcomingBookings.length > 0 && (
        <div className="card flex flex-col gap-2.5 animate-fade-in">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Tempahan Akan Datang</p>
          <div className="flex flex-col gap-2">
            {visibleBookings.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetailSlot(s)}
                className="card-tap flex items-center justify-between gap-2 rounded-xl border border-black/[0.05] px-3 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-900">{s.booking!.customerName}</p>
                  <p className="text-xs text-gray-400">
                    {formatDateLabel(s.date.slice(0, 10))} &middot; {s.startTime}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    BOOKING_STATUS_STYLE[s.booking!.status] ?? "bg-gray-50 text-gray-500"
                  }`}
                >
                  {BOOKING_STATUS_LABEL[s.booking!.status] ?? s.booking!.status}
                </span>
              </button>
            ))}
          </div>
          {upcomingBookings.length > 5 && !showAllBookings && (
            <button
              type="button"
              onClick={() => setShowAllBookings(true)}
              className="text-xs font-semibold text-brand-600 active:opacity-60"
            >
              Papar semua ({upcomingBookings.length})
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <DateStrip days={stripDays} selected={selectedDate} onSelect={selectDay} />

        <div className="card animate-fade-in">
          <p className="mb-2.5 text-sm font-bold text-brand-900">{formatDateLabel(selectedDate)}</p>
          {selectedDaySlots.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">Tiada slot untuk hari ini.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {(["pagi", "petang", "malam"] as const).map((tod) =>
                byTod[tod].length === 0 ? null : (
                  <div key={tod} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">{tod}</span>
                    <div className="flex flex-col gap-1.5">{byTod[tod].map((s) => renderRow(s))}</div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleAdd} className="card flex flex-col gap-3">
        <p className="text-[15px] font-bold text-brand-900">Tambah slot kosong (sekali sahaja)</p>
        <input
          className="input"
          type="date"
          value={date}
          min={todayStr()}
          onChange={(e) => handleDateChange(e.target.value)}
        />
        <div className="flex flex-col gap-2.5">
          {TIME_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.times.map((t) => {
                  const past = date === todayStr() && isPastTime(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      disabled={past}
                      onClick={() => toggleTime(t)}
                      className={`chip ${times.includes(t) ? "chip-active" : ""} ${past ? "cursor-not-allowed opacity-30" : ""}`}
                    >
                      {t} <span className="opacity-60">{timeOfDay(t)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button type="submit" className="btn-secondary flex items-center justify-center gap-1.5" disabled={saving || !date || times.length === 0}>
          <PlusIcon className="h-4 w-4" />
          {saving ? "Menambah..." : "Tambah Slot"}
        </button>
      </form>

      {detailSlot?.booking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setDetailSlot(null)}
        >
          <div
            className="animate-modal-in w-full max-w-sm rounded-3xl bg-white p-5 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {formatDateLabel(detailSlot.date.slice(0, 10))} &middot; {detailSlot.startTime}
                </p>
                <h3 className="mt-0.5 text-[17px] font-bold text-brand-900">{detailSlot.booking.customerName}</h3>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${BOOKING_STATUS_STYLE[detailSlot.booking.status] ?? "bg-gray-50 text-gray-500"}`}>
                {BOOKING_STATUS_LABEL[detailSlot.booking.status] ?? detailSlot.booking.status}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={`tel:${detailSlot.booking.customerPhone}`}
                className="flex items-center gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-sm font-medium text-brand-700 active:scale-[0.98]"
              >
                <PhoneIcon className="h-4 w-4 shrink-0" />
                {detailSlot.booking.customerPhone}
              </a>
              <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                {detailSlot.booking.customerAddress}
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
                <BriefcaseIcon className="h-4 w-4 shrink-0 text-gray-400" />
                {detailSlot.booking.serviceName}
              </div>
            </div>

            <a
              href={`/dashboard/${token}/bookings`}
              className="btn-secondary mt-4 flex w-full items-center justify-center"
            >
              Urus di Tempahan
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
