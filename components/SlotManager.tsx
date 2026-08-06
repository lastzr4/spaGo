"use client";

import { useState } from "react";

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {Object.keys(grouped).length === 0 && <p className="text-sm text-gray-500">Belum ada slot ditetapkan.</p>}
        {Object.entries(grouped).map(([d, daySlots]) => (
          <div key={d} className="card">
            <p className="mb-2 text-sm font-medium text-brand-900">{d}</p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                    s.status === "BOOKED" ? "border-brand-300 bg-brand-50 text-brand-700" : s.status === "BLOCKED" ? "border-black/10 bg-gray-100 text-gray-400" : "border-black/10 bg-white text-gray-600"
                  }`}
                >
                  <span>{s.startTime}</span>
                  <span className="text-[10px] uppercase">{s.status === "BOOKED" ? "Penuh" : s.status === "BLOCKED" ? "Ditutup" : "Kosong"}</span>
                  {s.status !== "BOOKED" && (
                    <>
                      <button onClick={() => blockSlot(s)} className="text-brand-400">
                        {s.status === "BLOCKED" ? "↺" : "✕"}
                      </button>
                      <button onClick={() => removeSlot(s.id)} className="text-red-400">🗑</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="card flex flex-col gap-3">
        <p className="text-sm font-medium text-brand-900">Tambah slot kosong</p>
        <input className="input" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {QUICK_TIMES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => toggleTime(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${times.includes(t) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-black/10 bg-white text-gray-600"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button type="submit" className="btn-secondary" disabled={saving || !date || times.length === 0}>
          {saving ? "Menambah..." : "+ Tambah Slot"}
        </button>
      </form>
    </div>
  );
}
