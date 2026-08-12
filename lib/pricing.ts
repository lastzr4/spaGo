// Shared promo-price + service-badge helpers — every screen that renders a
// service price or badge should go through these so the "is this actually
// a valid promo" rule (promoPrice must be lower than price) lives in one
// place instead of being re-implemented per component.

export const SERVICE_BADGES = ["RECOMMENDED", "MOST_POPULAR", "NEW", "LIMITED"] as const;
export type ServiceBadge = (typeof SERVICE_BADGES)[number];

export const BADGE_LABELS: Record<ServiceBadge, string> = {
  RECOMMENDED: "Disyorkan",
  MOST_POPULAR: "Paling Popular",
  NEW: "Baru",
  LIMITED: "Tawaran Terhad",
};

export const BADGE_STYLE: Record<ServiceBadge, string> = {
  RECOMMENDED: "bg-brand-500/15 text-brand-400",
  MOST_POPULAR: "bg-amber-500/15 text-amber-400",
  NEW: "bg-emerald-500/15 text-emerald-400",
  LIMITED: "bg-red-500/15 text-red-400",
};

// Solid gradient background for the diagonal corner-ribbon treatment (see
// components/ServiceBadgeRibbon.tsx) — needs to be opaque/bold, unlike the
// soft tinted BADGE_STYLE chip used in dense list rows.
export const BADGE_RIBBON_BG: Record<ServiceBadge, string> = {
  RECOMMENDED: "bg-gradient-to-r from-brand-600 to-brand-400",
  MOST_POPULAR: "bg-gradient-to-r from-amber-600 to-amber-400",
  NEW: "bg-gradient-to-r from-emerald-600 to-emerald-400",
  LIMITED: "bg-gradient-to-r from-red-600 to-red-400",
};

// Glow color fed into the --ribbon-glow-color CSS variable (see the
// animate-ribbon-glow keyframes in globals.css) so the pulsing shadow
// matches each badge's color instead of one fixed hue.
export const BADGE_GLOW_COLOR: Record<ServiceBadge, string> = {
  RECOMMENDED: "rgba(122, 81, 201, 0.65)",
  MOST_POPULAR: "rgba(245, 158, 11, 0.65)",
  NEW: "rgba(16, 185, 129, 0.65)",
  LIMITED: "rgba(239, 68, 68, 0.65)",
};

export function isValidBadge(value: unknown): value is ServiceBadge {
  return typeof value === "string" && (SERVICE_BADGES as readonly string[]).includes(value);
}

// A promo only counts if it's actually a real discount — a promoPrice equal
// to or above the regular price is treated as "no promo" everywhere.
export function hasPromo(price: number | string, promoPrice: number | string | null | undefined): boolean {
  if (promoPrice == null) return false;
  return Number(promoPrice) > 0 && Number(promoPrice) < Number(price);
}

export function getEffectivePrice(price: number | string, promoPrice: number | string | null | undefined): number {
  return hasPromo(price, promoPrice) ? Number(promoPrice) : Number(price);
}
