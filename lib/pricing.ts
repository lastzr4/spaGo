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
