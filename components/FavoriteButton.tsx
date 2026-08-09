"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/icons";
import { isFavorite, toggleFavorite, type FavoriteTherapist } from "@/lib/favorites";

export default function FavoriteButton({ therapist }: { therapist: FavoriteTherapist }) {
  const [favorited, setFavorited] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(therapist.id));
  }, [therapist.id]);

  function handleToggle(e: React.MouseEvent) {
    // TherapistCard wraps this in a <Link>; stop the click from also
    // triggering navigation. Must live here (a Client Component) since
    // Server Components can't carry their own onClick handlers.
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(therapist);
    setFavorited(next);
    if (next) {
      setPop(true);
      setTimeout(() => setPop(false), 450);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 ${
        favorited ? "bg-red-500/15" : "bg-[color:var(--surface-2)]"
      }`}
      aria-label={favorited ? "Buang dari kegemaran" : "Simpan sebagai kegemaran"}
    >
      <HeartIcon
        filled={favorited}
        className={`h-4 w-4 ${favorited ? "text-red-500" : "text-brand-600"} ${pop ? "animate-heart-pop" : ""}`}
      />
    </button>
  );
}
