"use client";

import { useState } from "react";

type Review = { id: string; customerName: string; rating: number; comment: string | null; hidden: boolean; createdAt: string };

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
    return <p className="text-sm text-gray-500">Belum ada ulasan lagi.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <div key={r.id} className={`card ${r.hidden ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-brand-900">{r.customerName}</p>
            <span className="text-yellow-400">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
          </div>
          {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
          <div className="mt-2 flex gap-3">
            <button onClick={() => toggleHidden(r)} className="text-xs font-medium text-brand-600">
              {r.hidden ? "Tunjukkan semula" : "Sembunyikan"}
            </button>
            <button onClick={() => removeReview(r.id)} className="text-xs font-medium text-red-500">Buang</button>
          </div>
        </div>
      ))}
    </div>
  );
}
