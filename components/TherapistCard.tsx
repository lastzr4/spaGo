import Link from "next/link";
import { StarIcon, MapPinIcon, QrIcon, CashIcon } from "@/components/icons";
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
  paymentMethod?: "QR" | "CASH" | null;
  slug?: string | null;
};

export default function TherapistCard({ therapist, area, gender }: { therapist: Therapist; area: string; gender: string }) {
  return (
    <Link
      href={`/therapists/${therapist.id}?area=${encodeURIComponent(area)}&gender=${gender}`}
      className="card card-tap relative flex gap-3.5"
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
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
        {therapist.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={therapist.photoUrl} alt={therapist.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white">
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
        <div className="flex items-start justify-between gap-2 pr-8">
          <h3 className="truncate font-semibold text-[color:var(--text-primary)]">{therapist.name}</h3>
          <span className="shrink-0 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-brand-600">
            {therapist.gender === "FEMALE" ? "Wanita" : "Lelaki"}
          </span>
        </div>
        {therapist.bio && <p className="mt-0.5 truncate text-[13px] text-[color:var(--text-secondary)]">{therapist.bio}</p>}
        <p className="mt-1 flex items-center gap-1 text-[12px] text-[color:var(--text-muted)]">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{therapist.coverageAreas.join(", ")}</span>
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          {therapist.priceFrom && (
            <span className="text-[13px] font-semibold text-brand-700">Dari RM{Number(therapist.priceFrom).toFixed(0)}</span>
          )}
        </div>
        <div className="mt-1.5">
          {therapist.depositRequired && therapist.depositAmount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-brand-600">
              {therapist.paymentMethod === "CASH" ? <CashIcon className="h-3 w-3" /> : <QrIcon className="h-3 w-3" />}
              Deposit RM{Number(therapist.depositAmount).toFixed(0)} &middot; {therapist.paymentMethod === "CASH" ? "Tunai" : "QR"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--text-muted)]">
              Tiada deposit diperlukan
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
