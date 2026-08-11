"use client";

import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CameraIcon, CheckCircleIcon, AlertTriangleIcon, SendIcon } from "@/components/icons";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const VERDICT_STYLE: Record<string, { label: string; className: string }> = {
  LIKELY_VALID: { label: "Nampak Sah (Semakan AI)", className: "bg-emerald-500/15 text-emerald-400" },
  NEEDS_MANUAL_CHECK: { label: "Perlu Semak Manual", className: "bg-amber-500/15 text-amber-400" },
  SUSPICIOUS: { label: "Mencurigakan — Sila Semak Teliti", className: "bg-red-500/15 text-red-400" },
};

export default function ReceiptUploadForm({
  bookingId,
  therapistPhone,
  depositAmount,
}: {
  bookingId: string;
  therapistPhone: string;
  depositAmount: number | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ verdict: string | null; notes: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });
      setPreview(dataUrl);
      const res = await fetch(`/api/bookings/${bookingId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError("Gagal upload resit. Sila cuba lagi.");
        return;
      }
      setResult({ verdict: data.verdict, notes: data.notes });
    } catch {
      setError("Gagal upload resit. Sila cuba lagi.");
    } finally {
      setUploading(false);
    }
  }

  const whatsappMessage = "Salam! Resit pembayaran deposit telah saya upload di SpaGo untuk tempahan saya. Sila semak.";
  const whatsappLink = buildWhatsAppLink(therapistPhone, whatsappMessage);
  const verdictStyle = result?.verdict ? VERDICT_STYLE[result.verdict] : null;

  return (
    <div className="flex flex-col gap-4">
      {depositAmount != null && (
        <div className="rounded-2xl bg-[color:var(--surface-2)]/60 p-4 text-center">
          <p className="text-xs text-[color:var(--text-secondary)]">Jumlah deposit dijangka</p>
          <p className="text-2xl font-bold text-brand-500">RM{depositAmount.toFixed(0)}</p>
        </div>
      )}

      {!result && (
        <label
          className={`card-tap flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-400/50 bg-[color:var(--surface-2)]/60 px-4 py-8 text-center ${
            uploading ? "pointer-events-none opacity-60" : "cursor-pointer"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratonton resit" className="mb-2 max-h-48 rounded-xl object-contain" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-brand-400">
              <CameraIcon className="h-5 w-5" />
            </span>
          )}
          <span className="text-sm font-semibold text-[color:var(--text-primary)]">
            {uploading ? "Sedang menyemak resit..." : "Tekan untuk pilih gambar resit"}
          </span>
          <span className="text-xs text-[color:var(--text-secondary)]">JPG, PNG atau WEBP</span>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}

      {error && <p className="rounded-xl bg-red-500/15 px-3.5 py-2.5 text-sm font-medium text-red-400">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Resit dimuat naik" className="max-h-56 w-full rounded-2xl object-contain" />
          )}
          <div className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold ${verdictStyle?.className ?? "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]"}`}>
            {result.verdict === "SUSPICIOUS" ? <AlertTriangleIcon className="h-4 w-4 shrink-0" /> : <CheckCircleIcon filled className="h-4 w-4 shrink-0" />}
            {verdictStyle?.label ?? "Tidak Dapat Disemak AI"}
          </div>
          <p className="text-xs leading-relaxed text-[color:var(--text-secondary)]">{result.notes}</p>
          <p className="rounded-xl bg-[color:var(--surface-2)]/60 px-3.5 py-2.5 text-xs text-[color:var(--text-muted)]">
            Nota: semakan ini oleh AI dan bukan jaminan pembayaran diterima. Terapis akan sahkan sendiri di aplikasi bank/e-wallet mereka sebelum menerima tempahan.
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center justify-center gap-2"
          >
            Buka WhatsApp
            <SendIcon className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
