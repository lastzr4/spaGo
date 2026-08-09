"use client";

import { useState } from "react";
import { StarIcon, TrashIcon, UndoIcon, AlertTriangleIcon } from "@/components/icons";

type Review = { id: string; customerName: string; rating: number; comment: string | null; hidden: boolean; aiFlagged?: boolean; createdAt: string };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-yellow-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= rating} className={`h-3.5 w-3.5 ${n > rating ? "text-[color:var(--text-muted)]" : ""}`} />
      ))}
    </span>
  );
}

export default function ReviewModeration({ token, initialReviews }: { token: string; initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);

  async function toggleHidden(review: Review) {
    const res = await fetch(`/api/dashboard/${token}/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !review.hidden }),
    });
    if (res.ok) {
      setReviews((list) => list.map((r) => (r.id === review.id ? { ...r, hidden: !r.hidden } : r)));
    }
  }

  async function removeReview(id: string) {
    const res = await fetch(`/api/dashboard/${token}/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((list) => list.filter((r) => r.id !== id));
  }

  if (reviews.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-1 py-8 text-center animate-fade-in">
        <p className="text-sm font-medium text-[color:var(--text-secondary)]">Belum ada ulasan lagi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r, i) => (
        <div key={r.id} className={`card animate-fade-in ${r.hidden ? "opacity-50" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">{r.customerName}</p>
            <Stars rating={r.rating} />
          </div>
          {r.aiFlagged && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-400">
              <AlertTriangleIcon className="h-3 w-3" />
              Ditanda AI — disembunyikan secara automatik untuk semakan
            </p>
          )}
          {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--text-secondary)]">{r.comment}</p>}
          <div className="mt-3 flex gap-4">
            <button onClick={() => toggleHidden(r)} className="flex items-center gap-1 text-xs font-semibold text-brand-600 active:opacity-60">
              {r.hidden ? <UndoIcon className="h-3.5 w-3.5" /> : null}
              {r.hidden ? "Tunjukkan semula" : "Sembunyikan"}
            </button>
            <button onClick={() => removeReview(r.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 active:opacity-60">
              <TrashIcon className="h-3.5 w-3.5" />
              Buang
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
