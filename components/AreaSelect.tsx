"use client";

import { useEffect, useMemo, useState } from "react";
import { AREAS_BY_STATE, STATES } from "@/lib/areas";
import { MapPinIcon, ChevronLeftIcon } from "@/components/icons";
import StateFlag from "@/components/StateFlag";

export default function AreaSelect({
  value,
  onChange,
  placeholder = "Pilih kawasan",
}: {
  value: string;
  onChange: (area: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openState, setOpenState] = useState<string | null>(
    STATES.find((s) => AREAS_BY_STATE[s].includes(value)) ?? null,
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const visibleStates = useMemo(() => {
    if (!q) return STATES;
    return STATES.filter(
      (s) => s.toLowerCase().includes(q) || AREAS_BY_STATE[s].some((a) => a.toLowerCase().includes(q)),
    );
  }, [q]);

  function pick(area: string) {
    onChange(area);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="input flex w-full items-center gap-2.5 text-left"
      >
        <MapPinIcon className="h-4 w-4 shrink-0 text-brand-300" />
        <span className={value ? "truncate text-[color:var(--text-primary)]" : "truncate text-[color:var(--text-muted)]"}>{value || placeholder}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="safe-bottom flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-[color:var(--surface-2)] p-5 animate-modal-in sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Pilih kawasan</p>
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-brand-300 active:opacity-60">
                Tutup
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari negeri atau kawasan..."
              className="input mb-3 text-sm"
              autoFocus
            />

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col divide-y divide-[color:var(--border)] overflow-hidden rounded-2xl border border-[color:var(--border)]">
                {visibleStates.map((state) => {
                  const areas = AREAS_BY_STATE[state].filter((a) => !q || a.toLowerCase().includes(q) || state.toLowerCase().includes(q));
                  const isOpen = openState === state || Boolean(q);

                  return (
                    <div key={state} className="bg-[color:var(--surface-2)]">
                      <button
                        type="button"
                        onClick={() => setOpenState((cur) => (cur === state ? null : state))}
                        className="card-tap flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-primary)]">
                          <StateFlag state={state} />
                          {state}
                        </span>
                        <ChevronLeftIcon className={`h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)] transition-transform ${isOpen ? "rotate-90" : "-rotate-90"}`} />
                      </button>
                      {isOpen && (
                        <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
                          {areas.map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => pick(a)}
                              className={`chip ${value === a ? "chip-active" : ""}`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {visibleStates.length === 0 && <p className="px-3.5 py-4 text-center text-sm text-[color:var(--text-muted)]">Tiada kawasan sepadan.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
