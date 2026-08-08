"use client";

import { useMemo, useState } from "react";
import { AREAS_BY_STATE, STATES } from "@/lib/areas";
import { ChevronLeftIcon, XIcon } from "@/components/icons";
import StateFlag from "@/components/StateFlag";

export default function AreaPicker({
  value,
  onToggle,
}: {
  value: string[];
  onToggle: (area: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [openState, setOpenState] = useState<string | null>(
    // Auto-open the first state that already has a selection (useful when
    // editing an existing profile), otherwise everything starts collapsed —
    // 16 states x several towns each is too much to show flat at once.
    STATES.find((s) => AREAS_BY_STATE[s].some((a) => value.includes(a))) ?? null,
  );

  const q = query.trim().toLowerCase();
  const visibleStates = useMemo(() => {
    if (!q) return STATES;
    return STATES.filter(
      (s) => s.toLowerCase().includes(q) || AREAS_BY_STATE[s].some((a) => a.toLowerCase().includes(q)),
    );
  }, [q]);

  return (
    <div className="flex flex-col gap-2.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onToggle(a)}
              className="chip chip-active flex items-center gap-1 pr-2"
            >
              {a}
              <XIcon className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari negeri atau kawasan..."
        className="input text-sm"
      />

      <div className="flex flex-col divide-y divide-black/[0.04] overflow-hidden rounded-2xl border border-black/[0.06]">
        {visibleStates.map((state) => {
          const areas = AREAS_BY_STATE[state].filter((a) => !q || a.toLowerCase().includes(q) || state.toLowerCase().includes(q));
          const selectedCount = AREAS_BY_STATE[state].filter((a) => value.includes(a)).length;
          const isOpen = openState === state || Boolean(q);

          return (
            <div key={state} className="bg-white">
              <button
                type="button"
                onClick={() => setOpenState((cur) => (cur === state ? null : state))}
                className="card-tap flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                  <StateFlag state={state} />
                  {state}
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
                      {selectedCount}
                    </span>
                  )}
                </span>
                <ChevronLeftIcon className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-90" : "-rotate-90"}`} />
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
                  {areas.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => onToggle(a)}
                      className={`chip ${value.includes(a) ? "chip-active" : ""}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {visibleStates.length === 0 && <p className="px-3.5 py-4 text-center text-sm text-gray-400">Tiada kawasan sepadan.</p>}
      </div>
    </div>
  );
}
