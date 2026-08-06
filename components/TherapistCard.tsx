import Link from "next/link";

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
};

export default function TherapistCard({ therapist, area, gender }: { therapist: Therapist; area: string; gender: string }) {
  return (
    <Link
      href={`/therapists/${therapist.id}?area=${encodeURIComponent(area)}&gender=${gender}`}
      className="card flex gap-4 transition-shadow hover:shadow-md"
    >
      {therapist.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={therapist.photoUrl} alt={therapist.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
          {therapist.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-brand-900">{therapist.name}</h3>
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            {therapist.gender === "FEMALE" ? "Terapis Wanita" : "Terapis Lelaki"}
          </span>
        </div>
        {therapist.bio && <p className="mt-1 truncate text-sm text-gray-500">{therapist.bio}</p>}
        <p className="mt-1 text-xs text-gray-400">{therapist.coverageAreas.join(", ")}</p>
        <div className="mt-1 flex items-center gap-2">
          {therapist.averageRating != null && (
            <span className="text-xs text-yellow-500">
              ★ {therapist.averageRating.toFixed(1)} <span className="text-gray-400">({therapist.reviewCount})</span>
            </span>
          )}
          {therapist.priceFrom && (
            <span className="text-sm font-medium text-brand-700">Dari RM{Number(therapist.priceFrom).toFixed(0)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
