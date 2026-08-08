"use client";

import { useState } from "react";
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default function GalleryViewer({ photos }: { photos: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  function show(delta: number) {
    setOpenIndex((i) => {
      if (i === null) return i;
      return (i + delta + photos.length) % photos.length;
    });
  }

  return (
    <div>
      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">Galeri</h2>
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="card-tap shrink-0"
            aria-label={`Lihat galeri ${i + 1} dengan lebih besar`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Galeri ${i + 1}`} className="h-24 w-24 rounded-2xl object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:scale-90"
            aria-label="Tutup"
          >
            <XIcon className="h-5 w-5" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[openIndex]}
            alt={`Galeri ${openIndex + 1}`}
            className="max-h-[80vh] max-w-full animate-pop-in rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <div className="mt-4 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => show(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white active:scale-90"
                aria-label="Sebelumnya"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-xs font-medium text-white/70">
                {openIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => show(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white active:scale-90"
                aria-label="Seterusnya"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
