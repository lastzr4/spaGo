"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import { StarIcon, PlusIcon } from "@/components/icons";

type Review = { id: string; customerName: string; rating: number; comment: string | null; createdAt: string };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-yellow-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= rating} className={`h-3.5 w-3.5 ${n > rating ? "text-[color:var(--text-muted)]" : ""}`} />
      ))}
    </span>
  );
}

export default function ReviewSection({
  therapistId,
  initialReviews,
  initialAverage,
}: {
  therapistId: string;
  initialReviews: Review[];
  initialAverage: number | null;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);

  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : initialAverage;

  async function refreshReviews() {
    const res = await fetch(`/api/therapists/${therapistId}/reviews`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews);
    }
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--text-primary)]">Ulasan Pelanggan</h2>
          {average !== null ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]">
              <Stars rating={Math.round(average)} />
              {average.toFixed(1)} ({reviews.length} ulasan)
            </p>
          ) : (
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Belum ada ulasan lagi.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="btn-ghost flex items-center gap-1 bg-[color:var(--surface-2)]"
        >
          {!showForm && <PlusIcon className="h-3.5 w-3.5" />}
          {showForm ? "Tutup" : "Tulis Ulasan"}
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade-in">
          <ReviewForm therapistId={therapistId} onSubmitted={refreshReviews} />
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          {reviews.map((r, i) => (
            <div key={r.id} className="card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">{r.customerName}</p>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--text-secondary)]">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
