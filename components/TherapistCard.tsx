import Link from "next/link";
import { StarIcon, MapPinIcon, QrIcon, CashIcon, WalletIcon } from "@/components/icons";
import FavoriteButton from "@/components/FavoriteButton";

type Service = { id: string; name: string; durationMinutes: number; price: string };
type Therapist = {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  bio: string | null;
  photoUrl?: string | null;
  coverageAreas: string[];
  services: Service[];
  priceFrom: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  depositRequired?: boolean;
  depositAmount?: string | null;
  paymentMethod?: "QR" | "CASH" | "TOYYIBPAY" | null;
  slug?: string | null;
};

// Shaped like a booking/appointment stub — a price column, a punched
// (notched) divider, then the therapist's details — instead of a plain
// uniform rounded card. The notch dots match the page background so they
// read as cut through the card; this only looks right on the page's own
// background (see app/therapists/page.tsx), not nested inside another
// surface.
export default function TherapistCard({ therapist, area, gender }: { therapist: Therapist; area: string; gender: string }) {
  return (
    <Link
      href={`/therapists/${therapist.id}?area=${encodeURIComponent(area)}&gender=${gender}`}
      className="card-tap relative flex overflow-hidden rounded-3xl border"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton
          therapist={{
            id: therapist.id,
            name: therapist.name,
            gender: therapist.gender,
            photoUrl: therapist.photoUrl ?? null,
            coverageAreas: therapist.coverageAreas,
            priceFrom: therapist.priceFrom,
            slug: therapist.slug ?? null,
          }}
        />
      </div>

      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 py-3 text-center">
        {therapist.priceFrom ? (
          <>
            <span className="text-[10px] text-[color:var(--text-muted)]">dari</span>
            <span className="font-display text-[17px] font-semibold leading-none text-brand-300">
              RM{Number(therapist.priceFrom).toFixed(0)}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-[color:var(--text-muted)]">Tanya harga</span>
        )}
      </div>

      <div className="relative w-0 shrink-0 border-l border-dashed" style={{ borderColor: "var(--border-strong)" }} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{ left: -5, top: `${8 + i * 28}%`, backgroundColor: "var(--app-bg, #120a1e)" }}
          />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 gap-3 p-3.5 pl-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          {therapist.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={therapist.photoUrl} alt={therapist.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white">
              {therapist.name.charAt(0).toUpperCase()}
            </div>
          )}
          {therapist.averageRating != null && (
            <span className="absolute bottom-1 left-1 right-1 inline-flex items-center justify-center gap-0.5 rounded-full bg-black/55 px-1 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <StarIcon filled className="h-2.5 w-2.5 text-yellow-400" />
              {therapist.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 pr-6">
            <h3 className="truncate font-display text-[17px] font-semibold text-[color:var(--text-primary)]">{therapist.name}</h3>
            <span className="mt-0.5 shrink-0 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-brand-300">
              {therapist.gender === "FEMALE" ? "Wanita" : "Lelaki"}
            </span>
          </div>
          {therapist.bio && <p className="mt-0.5 truncate text-xs text-[color:var(--text-secondary)]">{therapist.bio}</p>}
          <p className="mt-1 flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{therapist.coverageAreas.join(", ")}</span>
          </p>
          <div className="mt-1.5">
            {therapist.depositRequired && therapist.depositAmount ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-brand-300">
                {therapist.paymentMethod === "CASH" ? (
                  <CashIcon className="h-3 w-3" />
                ) : therapist.paymentMethod === "TOYYIBPAY" ? (
                  <WalletIcon className="h-3 w-3" />
                ) : (
                  <QrIcon className="h-3 w-3" />
                )}
                Deposit RM{Number(therapist.depositAmount).toFixed(0)} &middot;{" "}
                {therapist.paymentMethod === "CASH" ? "Tunai" : therapist.paymentMethod === "TOYYIBPAY" ? "Online" : "QR"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--text-muted)]">
                Tiada deposit diperlukan
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
