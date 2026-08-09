"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon } from "@/components/icons";
import { TIME_GROUPS, timeOfDay, WEEKDAYS } from "@/lib/slotTimes";

type WeeklyTemplate = Record<string, string[]>;

export default function SlotTemplateEditor({ token, initialTemplate }: { token: string; initialTemplate: WeeklyTemplate | null }) {
  const initialDays = initialTemplate ? Object.keys(initialTemplate).filter((k) => (initialTemplate[k]?.length ?? 0) > 0) : [];
  const initialTimes = initialDays.length > 0 ? initialTemplate![initialDays[0]] : [];

  const [days, setDays] = useState<string[]>(initialDays);
  const [times, setTimes] = useState<string[]>(initialTimes ?? []);
  const [open, setOpen] = useState(initialDays.length === 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleDay(key: string) {
    setDays((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));
  }

  function toggleTime(t: string) {
    setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const template: WeeklyTemplate = {};
    for (const d of days) template[d] = times;
    const res = await fetch(`/api/dashboard/${token}/slot-template`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const summary = days.length === 0 || times.length === 0 ? "Belum ditetapkan" : `${days.length} hari/minggu · ${times.length} slot/hari`;

  return (
    <div className="card flex flex-col gap-3 animate-fade-in">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-brand-500">
            <CalendarIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Slot berulang mingguan</p>
            <p className="text-xs text-[color:var(--text-muted)]">{summary}</p>
          </div>
        </div>
        <ChevronLeftIcon className={`h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition-transform ${open ? "rotate-90" : "-rotate-90"}`} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-3">
          <p className="text-xs leading-relaxed text-[color:var(--text-muted)]">
            Slot akan dijana automatik 14 hari ke hadapan setiap kali halaman ini dibuka. Kalau anda padam satu slot secara manual, ia takkan
            muncul semula.
          </p>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Hari bekerja</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => (
                <button
                  type="button"
                  key={w.key}
                  onClick={() => toggleDay(w.key)}
                  className={`chip ${days.includes(w.key) ? "chip-active" : ""}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {TIME_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.times.map((t) => (
                    <button type="button" key={t} onClick={() => toggleTime(t)} className={`chip ${times.includes(t) ? "chip-active" : ""}`}>
                      {t} <span className="opacity-60">{timeOfDay(t)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || days.length === 0 || times.length === 0}
            className="btn-secondary flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan template"}
          </button>
        </div>
      )}
    </div>
  );
}
