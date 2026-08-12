import { BADGE_LABELS, BADGE_RIBBON_BG, BADGE_GLOW_COLOR, ServiceBadge } from "@/lib/pricing";

// Diagonal corner ribbon (classic "SALE" banner style) with a pulsing glow —
// used to make a promo/badge tag pop out on a service photo instead of
// sitting as a flat inline pill. Must be placed inside a `relative
// overflow-hidden` container so the diagonal strip clips cleanly at the
// container's edges. `corner` picks which left-side corner it drapes across
// — top-left is the default "wow" placement, bottom-left is for spots (like
// the booking-detail hero image) where a close/back button already owns the
// top-left corner.
export default function ServiceBadgeRibbon({
  badge,
  size = "sm",
  corner = "top-left",
}: {
  badge: ServiceBadge;
  size?: "sm" | "lg";
  corner?: "top-left" | "bottom-left";
}) {
  const isLg = size === "lg";
  const isBottom = corner === "bottom-left";
  return (
    <div
      className={`pointer-events-none absolute z-10 animate-ribbon-glow text-center font-bold uppercase tracking-wider text-white ${BADGE_RIBBON_BG[badge]} ${
        isLg ? "w-40 py-1.5 text-[11px]" : "w-24 py-0.5 text-[8px]"
      } ${isBottom ? (isLg ? "bottom-4 -left-11" : "bottom-1.5 -left-7") : isLg ? "top-4 -left-11" : "top-1.5 -left-7"}`}
      style={{ transform: `rotate(${isBottom ? 45 : -45}deg)`, ["--ribbon-glow-color" as string]: BADGE_GLOW_COLOR[badge] }}
    >
      {BADGE_LABELS[badge]}
    </div>
  );
}
