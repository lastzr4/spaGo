"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, CalendarIcon } from "@/components/icons";
import { slotsNeededFor, findConsecutiveAvailableSlots } from "@/lib/slotOverlap";

type SlotOption = { id: string; date: string; startTime: string; endTime: string; status: string };

// Lets a therapist move a booking to a different open slot with no
// cancellation fee — an alternative to Batal for genuine reschedule
// requests, so goodwill customers aren't penalized under the late-
// cancellation policy.
export default function RescheduleSheet({
  token,
  bookingId,
  durationMinutes,
  onClose,
  onRescheduled,
}: {
  token: string;
  bookingId: string;
  durationMinutes: number;
  onClose: () => void;
  onRescheduled: (slot: { date: string; startTime: string; endTime: string }) => void;
}) {
  const slotsNeeded = slotsNeededFor(durationMinutes);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/dashboard/${token}/slots?from=${today}`);
      const data = await res.json().catch(() => null);
      if (!cancelled) {
        setSlots(((data?.slots ?? []) as SlotOption[]).filter((s) => s.status === "AVAILABLE"));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function pickSlot(slot: SlotOption) {
    setSaving(slot.id);
    setError(null);
    const res = await fetch(`/api/dashboard/${token}/bookings/${bookingId}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newSlotId: slot.id }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(
        data?.error === "SLOT_UNAVAILABLE"
          ? "Slot ini baru sahaja diambil. Sila pilih slot lain."
          : data?.error === "NOT_ENOUGH_CONSECUTIVE_SLOTS"
            ? "Tidak cukup slot berturut-turut untuk servis ini. Sila pilih slot lain."
            : "Gagal jadual semula. Sila cuba lagi."
      );
      setSaving(null);
      return;
    }
    onRescheduled({ date: slot.date.slice(0, 10), startTime: slot.startTime, endTime: slot.endTime });
  }

  const byDate: Record<string, SlotOption[]> = {};
  for (const s of slots) {
    const d = s.date.slice(0, 10);
    (byDate[d] ??= []).push(s);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="animate-modal-in flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl bg-[color:var(--surface)] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-brand-600"
            aria-label="Tutup"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Jadual Semula</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {slotsNeeded > 1 && !loading && (
            <p className="mb-3 text-xs text-[color:var(--text-secondary)]">
              Servis ini ({durationMinutes} minit) perlukan {slotsNeeded} slot berturut-turut.
            </p>
          )}
          {loading ? (
            <p className="text-sm text-[color:var(--text-secondary)]">Memuatkan slot...</p>
          ) : Object.keys(byDate).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarIcon className="h-6 w-6 text-brand-200" />
              <p className="text-sm text-[color:var(--text-secondary)]">Tiada slot kosong lain buat masa ini.</p>
            </div>
          ) : (
            Object.entries(byDate).map(([date, list]) => (
              <div key={date} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">{date}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => {
                    const notEnoughRoom = slotsNeeded > 1 && !findConsecutiveAvailableSlots(slots, s, slotsNeeded);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => pickSlot(s)}
                        disabled={saving !== null || notEnoughRoom}
                        title={notEnoughRoom ? `Tidak cukup slot berturut-turut untuk servis ${slotsNeeded} jam ini` : undefined}
                        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2 text-sm font-medium text-[color:var(--text-secondary)] active:scale-[0.96] disabled:opacity-50"
                      >
                        {saving === s.id ? "..." : s.startTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3.5 py-2.5 text-xs font-medium text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
