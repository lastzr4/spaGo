"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, UndoIcon, XIcon } from "@/components/icons";

type Slot = { id: string; date: string; startTime: string; endTime: string; status: "AVAILABLE" | "BOOKED" | "BLOCKED" };

const QUICK_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "19:00", "20:00"];

export default function SlotManager({ token, initialSlots }: { token: string; initialSlots: Slot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleTime(t: string) {
    setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
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
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                >
                  <span>{s.startTime}</span>
                  <span className="text-[10px] uppercase opacity-70">{STATUS_LABEL[s.status]}</span>
                  {s.status !== "BOOKED" && (
                    <>
                      <button onClick={() => blockSlot(s)} className="text-brand-400 active:opacity-60">
                        {s.status === "BLOCKED" ? <UndoIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => removeSlot(s.id)} className="text-red-400 active:opacity-60">
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="card flex flex-col gap-3">
        <p className="text-[15px] font-bold text-brand-900">Tambah slot kosong</p>
        <input className="input" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {QUICK_TIMES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => toggleTime(t)}
              className={`chip ${times.includes(t) ? "chip-active" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button type="submit" className="btn-secondary flex items-center justify-center gap-1.5" disabled={saving || !date || times.length === 0}>
          <PlusIcon className="h-4 w-4" />
          {saving ? "Menambah..." : "Tambah Slot"}
        </button>
      </form>
    </div>
  );
}
