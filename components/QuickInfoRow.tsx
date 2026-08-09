import type { ReactNode } from "react";

export type QuickInfoItem = { icon: ReactNode; label: string; value: string };

// Icon-box "amenities" style info row (inspired by the Spafy reference kit) —
// a dark surface container divided into equal columns, each with an icon,
// bold value, and small muted label underneath.
export default function QuickInfoRow({ items }: { items: QuickInfoItem[] }) {
  return (
    <div
      className="grid overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] py-3"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1 px-1.5 text-center ${i > 0 ? "border-l border-[color:var(--border)]" : ""}`}
        >
          <span className="text-brand-400">{it.icon}</span>
          <span className="truncate text-[13px] font-bold text-[color:var(--text-primary)]">{it.value}</span>
          <span className="truncate text-[10px] text-[color:var(--text-muted)]">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
