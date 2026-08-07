import { ClockIcon } from "@/components/icons";

export default function TherapistExtras({
  specialties,
  yearsExperience,
  workingHoursNote,
  galleryPhotos,
}: {
  specialties: string[];
  yearsExperience: number | null;
  workingHoursNote: string | null;
  galleryPhotos: string[];
}) {
  const hasContent = specialties.length > 0 || yearsExperience != null || workingHoursNote || galleryPhotos.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mb-5 flex animate-fade-in flex-col gap-3">
      {(specialties.length > 0 || yearsExperience != null) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {specialties.map((tag) => (
            <span key={tag} className="chip chip-active text-[12px]">
              {tag}
            </span>
          ))}
          {yearsExperience != null && (
            <span className="chip text-[12px] text-gray-500">{yearsExperience} tahun pengalaman</span>
          )}
        </div>
      )}

      {workingHoursNote && (
        <p className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <ClockIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
          {workingHoursNote}
        </p>
      )}

      {galleryPhotos.length > 0 && (
        <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
          {galleryPhotos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Galeri ${i + 1}`}
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
