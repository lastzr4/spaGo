"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, UndoIcon, XIcon, PhoneIcon, MapPinIcon, BriefcaseIcon } from "@/components/icons";

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

const TIME_GROUPS: { label: string; times: string[] }[] = [
  { label: "Pagi", times: ["09:00", "10:00", "11:00"] },
  { label: "Petang", times: ["13:00", "14:00", "15:00", "16:00", "17:00"] },
  { label: "Malam", times: ["19:00", "20:00"] },
];

function timeOfDay(t: string) {
  const h = Number(t.split(":")[0]);
  if (h < 12) return "pagi";
  if (h < 18) return "petang";
  return "malam";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Is this HH:MM already in the past, assuming the given calendar date is today?
function isPastTime(t: string) {
  const now = new Date();
  const [h, m] = t.split(":").map(Number);
  const slot = new Date();
  slot.setHours(h, m, 0, 0);
  return slot.getTime() < now.getTime();
}

// Is this date+time combo already in the past, right now?
function isPastSlot(dateStr: string, time: string) {
  const slot = new Date(`${dateStr.slice(0, 10)}T${time}:00`);
  return slot.getTime() < Date.now();
}

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

export default function SlotManager({ token, initialSlots }: { token: string; initialSlots: Slot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [detailSlot, setDetailSlot] = useState<Slot | null>(null);

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
          const endH = m === 0 ? h + 1 : h + 1;
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

  const upcoming = slots.filter((s) => s.date.slice(0, 10) >= new Date().toISOString().slice(0, 10));
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
  const STATUS_LABEL = { BOOKED: "Penuh", BLOCKED: "Ditutup", AVAILABLE: "Kosong" } as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {Object.keys(grouped).length === 0 && (
          <div className="card flex flex-col items-center gap-1 py-8 text-center animate-fade-in">
            <p className="text-sm font-medium text-gray-600">Belum ada slot ditetapkan.</p>
          </div>
        )}
        {Object.entries(grouped).map(([d, daySlots], i) => (
          <div key={d} className="card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
            <p className="mb-2.5 text-sm font-bold text-brand-900">{d}</p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((s) => {
                const past = isPastSlot(s.date, s.startTime);
                if (s.status === "BOOKED" && s.booking) {
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDetailSlot(s)}
                      className={`card-tap flex max-w-[170px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${BOOKING_CHIP_STYLE[s.booking.status] ?? STATUS_STYLE.BOOKED}`}
                    >
                      <span className="shrink-0">
                        {s.startTime} <span className="opacity-60">{timeOfDay(s.startTime)}</span>
                      </span>
                      <span className="truncate font-semibold">{s.booking.customerName}</span>
                    </button>
                  );
                }
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${
                      past ? "border-black/[0.06] bg-gray-50 text-gray-300" : STATUS_STYLE[s.status]
                    }`}
                  >
                    <span>
                      {s.startTime} <span className="opacity-60">{timeOfDay(s.startTime)}</span>
                    </span>
                    <span className="text-[10px] uppercase opacity-70">{past ? "Lepas" : STATUS_LABEL[s.status]}</span>
                    {!past && (
                      <button onClick={() => blockSlot(s)} className="text-brand-400 active:opacity-60">
                        {s.status === "BLOCKED" ? <UndoIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button onClick={() => removeSlot(s.id)} className={`active:opacity-60 ${past ? "text-gray-300" : "text-red-400"}`}>
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="card flex flex-col gap-3">
        <p className="text-[15px] font-bold text-brand-900">Tambah slot kosong</p>
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
                  {detailSlot.date.slice(0, 10)} &middot; {detailSlot.startTime}
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
