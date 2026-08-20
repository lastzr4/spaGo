import { AwardIcon, SparkleIcon } from "@/components/icons";

export default function TherapistBadges({
  averageRating,
  reviewCount,
  createdAt,
}: {
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
}) {
  const isTopRated = averageRating != null && averageRating >= 4.5 && reviewCount >= 3;
  const isNew = Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 30 && !isTopRated;

  if (!isTopRated && !isNew) return null;

  return (
    <div className="flex items-center gap-1.5">
      {isTopRated && (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-600">
          <AwardIcon className="h-3 w-3" />
          Top Rated
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-brand-300">
          <SparkleIcon className="h-3 w-3" />
          Terapis Baru
        </span>
      )}
    </div>
  );
}
