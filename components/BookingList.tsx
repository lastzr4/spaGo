"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarIcon, CheckCircleIcon, XIcon, ClipboardListIcon, AlertTriangleIcon, WalletIcon } from "@/components/icons";
import { buildGoogleCalendarLink } from "@/lib/googleCalendar";
import { isLateCancellation } from "@/lib/cancellation";
import ConfirmDialog from "@/components/ConfirmDialog";
import RescheduleSheet from "@/components/RescheduleSheet";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  healthConsentAccepted: boolean;
  healthConsentAcceptedAt: string | null;
  depositAmountSnapshot: string | null;
  depositForfeited: boolean;
  outcallFee: string;
  travelDistanceKm: number | null;
  depositReceiptUrl: string | null;
  depositReceiptUploadedAt: string | null;
  depositReceiptAiVerdict: string | null;
  depositReceiptAiNotes: string | null;
};

const RECEIPT_VERDICT_STYLE: Record<string, { label: string; className: string }> = {
  LIKELY_VALID: { label: "AI: Nampak Sah", className: "bg-emerald-500/15 text-emerald-400" },
  NEEDS_MANUAL_CHECK: { label: "AI: Perlu Semak Manual", className: "bg-amber-500/15 text-amber-400" },
  SUSPICIOUS: { label: "AI: Mencurigakan", className: "bg-red-500/15 text-red-400" },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Disahkan",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  CONFIRMED: "bg-[color:var(--surface-2)] text-brand-600",
  CANCELLED: "bg-red-500/15 text-red-500",
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
};

function isOverdue(b: Booking) {
  // A confirmed booking whose session should already be over but hasn't
  // been marked Selesai/Dibatalkan — flag it instead of silently sitting
  // there looking like any other upcoming "Disahkan" booking.
  if (b.status !== "CONFIRMED") return false;
  const endInstant = new Date(`${b.date}T${b.endTime}:00+08:00`);
  return endInstant.getTime() < Date.now();
}

type StatusFilter = "ALL" | Booking["status"];

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Menunggu" },
  { value: "CONFIRMED", label: "Disahkan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export default function BookingList({
  token,
  initialBookings,
  cancellationWindowHours = 2,
}: {
  token: string;
  initialBookings: Booking[];
  cancellationWindowHours?: number;
}) {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [bookings, setBookings] = useState(initialBookings);
  const [updating, setUpdating] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>(
    initialStatus && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(initialStatus)
      ? (initialStatus as StatusFilter)
      : "ALL"
  );

  const filteredBookings = useMemo(
    () => (filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  async function updateStatus(id: string, status: Booking["status"]) {
    setUpdating(id);
    const res = await fetch(`/api/dashboard/${token}/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setBookings((list) =>
        list.map((b) => (b.id === id ? { ...b, status, depositForfeited: data?.depositForfeited ?? false } : b))
      );
    }
    setUpdating(null);
  }

  // Cancelling a booking that's already CONFIRMED and inside the
  // late-cancellation window forfeits the deposit — warn before acting on
  // it instead of silently applying the policy.
  function handleCancelTap(b: Booking) {
    const willForfeit =
      b.status === "CONFIRMED" &&
      b.depositAmountSnapshot != null &&
      Number(b.depositAmountSnapshot) > 0 &&
      isLateCancellation(b.date, b.startTime, cancellationWindowHours);
    if (willForfeit) {
      setCancelTarget(b);
    } else {
      updateStatus(b.id, "CANCELLED");
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <CalendarIcon className="h-8 w-8 text-brand-200" />
        <p className="text-sm text-[color:var(--text-secondary)]">Belum ada tempahan lagi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => {
          const count = f.value === "ALL" ? bookings.length : bookings.filter((b) => b.status === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`chip shrink-0 ${filter === f.value ? "chip-active" : ""}`}
            >
              {f.label}
              <span className={`ml-0.5 text-[11px] ${filter === f.value ? "text-brand-500" : "text-[color:var(--text-muted)]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <CalendarIcon className="h-8 w-8 text-brand-200" />
          <p className="text-sm text-[color:var(--text-secondary)]">Tiada tempahan dalam kategori ini.</p>
        </div>
      )}

      {filteredBookings.map((b, i) => {
        const overdue = isOverdue(b);
        return (
        <div key={b.id} className={`card animate-fade-in ${overdue ? "ring-1 ring-amber-300" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate font-semibold text-[color:var(--text-primary)]">{b.customerName}</p>
            <span className="flex shrink-0 items-center gap-1.5">
              {overdue && (
                <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-400">
                  Tertunggak
                </span>
              )}
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status] ?? "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]"}`}>
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[color:var(--text-secondary)]">{b.serviceName} &middot; {b.date} {b.startTime}</p>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">{b.customerPhone} &middot; {b.customerAddress}</p>
          {Number(b.outcallFee) > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-500">
              <WalletIcon className="h-3 w-3" />
              Caj perjalanan: RM{Number(b.outcallFee).toFixed(0)}
              {b.travelDistanceKm != null && ` (~${b.travelDistanceKm.toFixed(1)} km)`}
            </p>
          )}
          {b.healthConsentAccepted && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <ClipboardListIcon className="h-3 w-3" />
              Penafian kesihatan diterima
              {b.healthConsentAcceptedAt &&
                ` — ${new Date(b.healthConsentAcceptedAt).toLocaleString("ms-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
            </p>
          )}
          {b.depositForfeited && b.depositAmountSnapshot && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-400">
              <AlertTriangleIcon className="h-3 w-3" />
              Deposit RM{Number(b.depositAmountSnapshot).toFixed(0)} dirampas — pembatalan lewat
            </p>
          )}

          {b.depositReceiptUrl && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[color:var(--surface-2)]/60 p-2.5">
              <button type="button" onClick={() => setViewingReceipt(b.depositReceiptUrl)} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.depositReceiptUrl} alt="Resit pembayaran" className="h-14 w-14 rounded-lg object-cover" />
              </button>
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    (b.depositReceiptAiVerdict && RECEIPT_VERDICT_STYLE[b.depositReceiptAiVerdict]?.className) ?? "bg-[color:var(--surface-2)] text-[color:var(--text-muted)]"
                  }`}
                >
                  {(b.depositReceiptAiVerdict && RECEIPT_VERDICT_STYLE[b.depositReceiptAiVerdict]?.label) ?? "AI tidak dapat semak"}
                </span>
                {b.depositReceiptAiNotes && <p className="mt-1 text-[11px] leading-snug text-[color:var(--text-secondary)]">{b.depositReceiptAiNotes}</p>}
              </div>
            </div>
          )}

          {b.status === "PENDING" && b.depositAmountSnapshot && Number(b.depositAmountSnapshot) > 0 && (
            <p className="mt-2 text-[11px] leading-snug text-[color:var(--text-muted)]">
              Sila sahkan deposit betul-betul masuk di bank/e-wallet anda sebelum tekan Sahkan — semakan AI di atas bukan jaminan.
            </p>
          )}

          {(b.status === "PENDING" || b.status === "CONFIRMED") && (
            <div className="mt-3 flex gap-2">
              {b.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => updateStatus(b.id, "CONFIRMED")}
                  disabled={updating === b.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--surface-2)] px-3 py-2 text-xs font-semibold text-brand-600 active:scale-[0.97] disabled:opacity-40"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Sahkan
                </button>
              )}
              {b.status === "CONFIRMED" && (
                <button
                  type="button"
                  onClick={() => updateStatus(b.id, "COMPLETED")}
                  disabled={updating === b.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 active:scale-[0.97] disabled:opacity-40"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Tandakan Selesai
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCancelTap(b)}
                disabled={updating === b.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-500 active:scale-[0.97] disabled:opacity-40"
              >
                <XIcon className="h-3.5 w-3.5" />
                Batal
              </button>
            </div>
          )}

          {b.status === "CONFIRMED" && (
            <button
              type="button"
              onClick={() => setRescheduleTarget(b)}
              disabled={updating === b.id}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold text-[color:var(--text-secondary)] active:scale-[0.97] disabled:opacity-40"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Jadual Semula
            </button>
          )}

          {b.status === "CONFIRMED" && (
            <a
              href={buildGoogleCalendarLink({
                title: `SpaGo: ${b.serviceName} - ${b.customerName}`,
                description: `Tempahan SpaGo\nPelanggan: ${b.customerName}\nTelefon: ${b.customerPhone}\nServis: ${b.serviceName}`,
                location: b.customerAddress,
                date: b.date,
                startTime: b.startTime,
                endTime: b.endTime,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold text-[color:var(--text-secondary)] active:scale-[0.97]"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Tambah ke Google Calendar
            </a>
          )}
        </div>
        );
      })}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Pembatalan Lewat"
        message={
          cancelTarget
            ? `Tempahan ini kurang daripada ${cancellationWindowHours} jam sebelum sesi. Deposit RM${Number(cancelTarget.depositAmountSnapshot).toFixed(0)} akan direkod sebagai pampasan mengikut polisi anda. Teruskan batalkan?`
            : ""
        }
        confirmLabel="Ya, Batalkan"
        danger
        busy={updating !== null}
        onConfirm={() => {
          if (cancelTarget) updateStatus(cancelTarget.id, "CANCELLED");
          setCancelTarget(null);
        }}
        onCancel={() => setCancelTarget(null)}
      />

      {viewingReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setViewingReceipt(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewingReceipt} alt="Resit pembayaran" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}

      {rescheduleTarget && (
        <RescheduleSheet
          token={token}
          bookingId={rescheduleTarget.id}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={(slot) => {
            setBookings((list) =>
              list.map((b) => (b.id === rescheduleTarget.id ? { ...b, date: slot.date, startTime: slot.startTime, endTime: slot.endTime } : b))
            );
            setRescheduleTarget(null);
          }}
        />
      )}
    </div>
  );
}
