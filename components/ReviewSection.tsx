"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";

type Review = { id: string; customerName: string; rating: number; comment: string | null; createdAt: string };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
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
          <h2 className="font-semibold text-brand-900">Ulasan Pelanggan</h2>
          {average !== null ? (
            <p className="text-sm text-gray-500">
              <Stars rating={Math.round(average)} /> {average.toFixed(1)} ({reviews.length} ulasan)
            </p>
          ) : (
            <p className="text-sm text-gray-500">Belum ada ulasan lagi.</p>
          )}
        </div>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="text-sm font-medium text-brand-600">
          {showForm ? "Tutup" : "+ Tulis Ulasan"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <ReviewForm therapistId={therapistId} onSubmitted={refreshReviews} />
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-brand-900">{r.customerName}</p>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
