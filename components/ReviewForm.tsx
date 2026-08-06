"use client";

import { useState } from "react";

export default function ReviewForm({ therapistId, onSubmitted }: { therapistId: string; onSubmitted?: () => void }) {
  const [rating, setRating] = useState(5);
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName) {
      setError("Sila isi nama anda.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/therapists/${therapistId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, rating, comment: comment || undefined }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      onSubmitted?.();
    } catch {
      setError("Gagal menghantar ulasan. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="text-sm text-brand-700">Terima kasih atas ulasan anda!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-900">Penilaian</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} bintang`}
              className={`text-2xl leading-none ${n <= rating ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <input className="input" placeholder="Nama anda" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
      <textarea className="input" placeholder="Kongsi pengalaman anda (opsyenal)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-secondary" disabled={submitting}>
        {submitting ? "Menghantar..." : "Hantar Ulasan"}
      </button>
    </form>
  );
}
