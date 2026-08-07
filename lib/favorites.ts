"use client";

// Client-side favourites — no customer login exists, so we persist a
// lightweight snapshot of each favourited therapist directly in
// localStorage instead of just an id (which would need a backend lookup).
export type FavoriteTherapist = {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  photoUrl: string | null;
  coverageAreas: string[];
  priceFrom: string | null;
  slug: string | null;
};

const KEY = "spago_favorites";

function read(): FavoriteTherapist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list: FavoriteTherapist[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode etc) — fail silently
  }
}

export function getFavorites(): FavoriteTherapist[] {
  return read();
}

export function isFavorite(id: string): boolean {
  return read().some((t) => t.id === id);
}

export function toggleFavorite(therapist: FavoriteTherapist): boolean {
  const list = read();
  const exists = list.some((t) => t.id === therapist.id);
  const next = exists ? list.filter((t) => t.id !== therapist.id) : [...list, therapist];
  write(next);
  return !exists;
}
