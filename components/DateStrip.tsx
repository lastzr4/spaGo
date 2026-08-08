"use client";

export type DayPill = { date: string; label: string; hasSlots: boolean; hasBooking: boolean };

export default function DateStrip({
  days,
  selected,
  onSelect,
}: {
  days: DayPill[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d) => {
        const isSelected = d.date === selected;
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onSelect(d.date)}
            className={`card-tap relative shrink-0 rounded-2xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap ${
              isSelected
                ? "border-brand-500 bg-brand-500 text-white"
                : d.hasSlots
                  ? "border-black/[0.06] bg-white text-gray-600"
                  : "border-black/[0.04] bg-gray-50 text-gray-300"
            }`}
          >
            {d.label}
            {d.hasBooking && (
              <span
                className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`}
              />
            )}
          </button>
        );
      })}
      <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-gray-200 px-3 py-2 text-xs font-semibold text-gray-400">
        Lain
        <input type="date" className="hidden" onChange={(e) => e.target.value && onSelect(e.target.value)} />
      </label>
    </div>
  );
}
