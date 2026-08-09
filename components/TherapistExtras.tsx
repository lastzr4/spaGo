import { ClockIcon } from "@/components/icons";
import GalleryViewer from "@/components/GalleryViewer";

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
    <div className="mb-6 flex animate-fade-in flex-col gap-3">
      {(specialties.length > 0 || yearsExperience != null) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {specialties.map((tag) => (
            <span key={tag} className="chip chip-active text-[12px]">
              {tag}
            </span>
          ))}
          {yearsExperience != null && (
            <span className="chip text-[12px] text-[color:var(--text-secondary)]">{yearsExperience} tahun pengalaman</span>
          )}
        </div>
      )}

      {workingHoursNote && (
        <p className="flex items-center gap-1.5 text-[13px] text-[color:var(--text-secondary)]">
          <ClockIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
          {workingHoursNote}
        </p>
      )}

      {galleryPhotos.length > 0 && <GalleryViewer photos={galleryPhotos} />}
    </div>
  );
}
