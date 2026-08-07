"use client";

import { useMemo } from "react";

const COLORS = ["#7a51c9", "#ff5fa2", "#22c55e", "#f59e0b", "#0ea5e9", "#f43f5e"];

/**
 * Small burst of falling confetti pieces, purely decorative. Mount it
 * conditionally (e.g. `{celebrate && <Confetti />}`) for a brief moment
 * after a booking/review success — unmount it yourself after ~1.2s.
 */
export default function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.35,
        duration: 0.9 + Math.random() * 0.6,
        round: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-40 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
