"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/icons";
import { isFavorite, toggleFavorite, type FavoriteTherapist } from "@/lib/favorites";

export default function FavoriteButton({ therapist }: { therapist: FavoriteTherapist }) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(therapist.id));
  }, [therapist.id]);

  function handleToggle() {
    const next = toggleFavorite(therapist);
    setFavorited(next);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform active:scale-90"
      aria-label={favorited ? "Buang dari kegemaran" : "Simpan sebagai kegemaran"}
    >
      <HeartIcon filled={favorited} className={`h-4 w-4 ${favorited ? "text-red-500" : ""}`} />
    </button>
  );
}
