"use client";

type Option<T extends string> = { value: T; label: string };

/**
 * iOS-style segmented control with an animated sliding thumb behind the
 * active option. Generic over any string union so it can replace the
 * various 2-3 way gender/policy pickers scattered across the app.
 */
export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: Option<T>[];
  value: T | "";
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const hasValue = options.some((o) => o.value === value);
  const n = options.length;

  return (
    <div
      className={`relative flex w-full rounded-2xl bg-[color:var(--surface-2)] p-1 ${size === "sm" ? "text-sm" : "text-[15px]"}`}
      role="tablist"
    >
      {hasValue && (
        <div
          aria-hidden
          className="segmented-thumb absolute inset-y-1 rounded-xl shadow-[0_4px_14px_-4px_rgba(122,81,201,0.55)]"
          style={{
            width: `calc(${100 / n}% - 4px)`,
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
            backgroundImage:
              "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 75%, black))",
          }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`relative z-10 flex-1 rounded-xl px-3 font-semibold transition-colors duration-200 active:scale-[0.97] ${
              size === "sm" ? "py-2" : "py-3"
            } ${active ? "text-white" : "text-brand-600"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
