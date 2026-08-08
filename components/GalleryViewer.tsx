"use client";

import { useRef, useState } from "react";
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default function GalleryViewer({ photos }: { photos: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  if (photos.length === 0) return null;

  function show(delta: number) {
    setDirection(delta);
    setOpenIndex((i) => {
      if (i === null) return i;
      return (i + delta + photos.length) % photos.length;
    });
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function onTouchEnd() {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    if (Math.abs(delta) > 45 && photos.length > 1) {
      show(delta < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  }

  return (
    <div>
      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">Galeri</h2>
      <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5">
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setDirection(1);
              setOpenIndex(i);
            }}
            className="card-tap shrink-0 snap-start"
            aria-label={`Lihat galeri ${i + 1} dengan lebih besar`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Galeri ${i + 1}`} className="h-24 w-24 rounded-2xl object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="animate-gallery-fade fixed inset-0 z-50 flex touch-pan-y flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
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
            key={openIndex}
            src={photos[openIndex]}
            alt={`Galeri ${openIndex + 1}`}
            className="animate-gallery-slide max-h-[75vh] max-w-full select-none rounded-2xl object-contain"
            style={{ ["--gdir" as string]: direction > 0 ? "18px" : "-18px" }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {photos.length > 1 && (
            <div className="mt-4 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-6">
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
              <div className="flex items-center gap-1.5">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === openIndex ? "w-4 bg-white" : "w-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
