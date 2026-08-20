"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartIcon } from "@/components/icons";
import { getFavorites, toggleFavorite, type FavoriteTherapist } from "@/lib/favorites";

export default function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteTherapist[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setLoaded(true);
  }, []);

  function handleRemove(t: FavoriteTherapist) {
    toggleFavorite(t);
    setFavorites((list) => list.filter((x) => x.id !== t.id));
  }

  if (!loaded) return null;

  if (favorites.length === 0) {
    return (
      <div className="card flex animate-fade-in flex-col items-center gap-2 py-10 text-center">
        <HeartIcon className="h-8 w-8 text-brand-200" />
        <p className="text-sm font-medium text-[color:var(--text-secondary)]">Belum ada terapis kegemaran.</p>
        <p className="text-xs text-[color:var(--text-muted)]">Tekan ikon hati pada profil terapis untuk simpan di sini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {favorites.map((t, i) => (
        <div key={t.id} className="card animate-fade-in flex items-center gap-3" style={{ animationDelay: `${i * 40}ms` }}>
          <Link href={t.slug ? `/t/${t.slug}` : `/therapists/${t.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            {t.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.photoUrl} alt={t.name} className="avatar-ring h-14 w-14 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="avatar-ring flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white">
                {t.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-[color:var(--text-primary)]">{t.name}</p>
              <p className="truncate text-xs text-[color:var(--text-secondary)]">{t.coverageAreas.join(", ")}</p>
              {t.priceFrom && <p className="text-[13px] font-semibold text-brand-300">Dari RM{Number(t.priceFrom).toFixed(0)}</p>}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => handleRemove(t)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500 active:scale-90"
            aria-label="Buang"
          >
            <HeartIcon filled className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
