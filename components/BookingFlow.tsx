"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildWhatsAppBookingMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { CheckCircleIcon, SendIcon, CalendarIcon, AlertTriangleIcon, QrIcon, CashIcon, ChevronRightIcon } from "@/components/icons";
import Confetti from "@/components/Confetti";
import { isPastSlot } from "@/lib/slotTimes";

type Service = { id: string; name: string; durationMinutes: number; price: string; photoUrl?: string | null };
type Slot = { id: string; date: string; startTime: string; endTime: string };

const WEEKDAY = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

function formatDatePill(d: string) {
  const date = new Date(d + "T00:00:00");
  return { weekday: WEEKDAY[date.getDay()], day: date.getDate(), month: MONTH[date.getMonth()] };
}

export default function BookingFlow({
  therapistId,
  therapistPhone,
  services,
  slots,
  customerGender,
  depositRequired = false,
  depositAmount = null,
  paymentMethod = null,
  qrCodeUrl = null,
  extraChargesNote = null,
}: {
  therapistId: string;
  therapistPhone: string;
  services: Service[];
  slots: Slot[];
  customerGender: "MALE" | "FEMALE";
  depositRequired?: boolean;
  depositAmount?: string | null;
  paymentMethod?: "QR" | "CASH" | null;
  qrCodeUrl?: string | null;
  extraChargesNote?: string | null;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slotId, setSlotId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositConfirmed, setDepositConfirmed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [justBooked, setJustBooked] = useState(false);
  const [detailsRevealed, setDetailsRevealed] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const d = s.date.slice(0, 10);
      map[d] = map[d] ? [...map[d], s] : [s];
    }
    return map;
  }, [slots]);

  const dates = Object.keys(slotsByDate);
  const [activeDate, setActiveDate] = useState(dates[0] ?? "");

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedSlot = slots.find((s) => s.id === slotId);

  useEffect(() => {
    if (detailsRevealed) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detailsRevealed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!serviceId || !slotId || !name || !phone || !address) {
      setError("Sila lengkapkan semua maklumat.");
      const target = !name ? nameRef.current : !phone ? phoneRef.current : addressRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId,
          serviceId,
          slotId,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          customerGender,
          referralCodeUsed: referralCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "SLOT_UNAVAILABLE"
            ? "Slot ini baru sahaja ditempah orang lain. Sila pilih slot lain."
            : "Tempahan gagal. Sila cuba lagi."
        );
        setSubmitting(false);
        return;
      }

      const message = buildWhatsAppBookingMessage({
        customerName: name,
        serviceName: selectedService?.name ?? "",
        durationMinutes: selectedService?.durationMinutes ?? 0,
        date: selectedSlot?.date.slice(0, 10) ?? "",
        startTime: selectedSlot?.startTime ?? "",
        address,
        depositInfo: depositRequired && depositAmount
          ? paymentMethod === "CASH"
            ? `RM${Number(depositAmount).toFixed(0)} (tunai semasa terapis tiba)`
            : `RM${Number(depositAmount).toFixed(0)} (QR — butiran akan diberikan terapis)`
          : undefined,
        extraChargesNote: extraChargesNote || undefined,
        referralCode: referralCode || undefined,
      });
      const link = buildWhatsAppLink(therapistPhone, message);
      setJustBooked(true);
      setTimeout(() => {
        window.location.href = link;
      }, 1100);
    } catch {
      setError("Tempahan gagal. Sila cuba lagi.");
      setSubmitting(false);
    }
  }

  if (services.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-1 py-8 text-center">
        <p className="text-sm font-medium text-gray-600">Terapis ini belum menetapkan sebarang servis.</p>
      </div>
    );
  }

  if (justBooked) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center animate-fade-in">
        <Confetti />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircleIcon filled className="h-8 w-8" />
        </div>
        <p className="text-[15px] font-bold text-brand-900">Tempahan dihantar!</p>
        <p className="max-w-[240px] text-sm text-gray-500">Membuka WhatsApp untuk sahkan dengan terapis...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-24">
      {extraChargesNote && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>Caj tambahan mungkin dikenakan: {extraChargesNote}</span>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-[15px] font-bold text-brand-900">Pilih servis</h2>
        <div className="flex flex-col gap-2.5">
          {services.map((s) => {
            const active = serviceId === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`card-tap flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  active ? "border-brand-500 bg-brand-50/70 shadow-card" : "border-black/[0.06] bg-white"
                }`}
              >
                {s.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photoUrl} alt={s.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-[11px] font-medium text-brand-400">
                    Foto
                  </div>
                )}
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-brand-900">{s.name}</span>
                    <span className="block text-xs text-gray-500">{s.durationMinutes} minit</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-semibold text-brand-700">
                    RM{Number(s.price).toFixed(0)}
                    {active && <CheckCircleIcon filled className="h-4 w-4 text-brand-600" />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-bold text-brand-900">
          <CalendarIcon className="h-4 w-4 text-brand-500" />
          Pilih slot masa
        </h2>
        {dates.length === 0 ? (
          <div className="card flex flex-col items-center gap-1 py-8 text-center">
            <p className="text-sm font-medium text-gray-600">Tiada slot kosong buat masa ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {dates.map((d) => {
                const { weekday, day, month } = formatDatePill(d);
                const active = activeDate === d;
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setActiveDate(d)}
                    className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3.5 py-2.5 transition-all active:scale-[0.96] ${
                      active ? "bg-brand-600 text-white shadow-card" : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    <span className={`text-[10px] font-medium uppercase ${active ? "text-white/80" : "text-brand-400"}`}>{weekday}</span>
                    <span className="text-base font-bold leading-none">{day}</span>
                    <span className={`text-[10px] ${active ? "text-white/80" : "text-brand-400"}`}>{month}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {(slotsByDate[activeDate] ?? []).map((s) => {
                const past = isPastSlot(s.date, s.startTime);
                return (
                  <button
                    type="button"
                    key={s.id}
                    disabled={past}
                    onClick={() => setSlotId(s.id)}
                    className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors active:scale-[0.96] ${
                      past
                        ? "cursor-not-allowed border-black/[0.04] bg-gray-50 text-gray-300"
                        : slotId === s.id
                          ? "border-brand-600 bg-brand-600 text-white shadow-card"
                          : "border-black/[0.08] bg-white text-gray-600"
                    }`}
                  >
                    {s.startTime}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {detailsRevealed && (
      <div ref={detailsRef} className="flex animate-fade-in flex-col gap-3 scroll-mt-5">
        <h2 className="text-[15px] font-bold text-brand-900">Maklumat anda</h2>
        <input ref={nameRef} className="input" placeholder="Nama penuh" value={name} onChange={(e) => setName(e.target.value)} required />
        <input ref={phoneRef} className="input" placeholder="No. telefon anda" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <textarea ref={addressRef} className="input" placeholder="Alamat penuh untuk urutan" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
        <input
          className="input"
          placeholder="Kod rujukan (jika ada)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
        />
      </div>
      )}

      {detailsRevealed && depositRequired && depositAmount && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
              {paymentMethod === "CASH" ? <CashIcon className="h-4 w-4" /> : <QrIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-brand-900">Deposit RM{Number(depositAmount).toFixed(0)} diperlukan</p>
              <p className="text-xs text-gray-500">
                {paymentMethod === "CASH"
                  ? "Dibayar tunai semasa terapis tiba."
                  : "Butiran pembayaran akan diberikan terapis melalui WhatsApp selepas tempahan."}
              </p>
            </div>
          </div>

          {paymentMethod === "QR" && qrCodeUrl && (
            <>
              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                className="btn-ghost mt-3 w-full justify-center bg-white text-xs"
              >
                {showQr ? "Sembunyikan kod QR" : "Lihat kod QR sekarang"}
              </button>
              {showQr && (
                <div className="mt-3 flex flex-col items-center gap-2 animate-fade-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="Kod QR pembayaran" className="h-40 w-40 rounded-xl border border-black/[0.06] object-cover" />
                </div>
              )}
            </>
          )}

          <label className="mt-3 flex items-start gap-2.5 rounded-xl bg-white px-3.5 py-3">
            <input
              type="checkbox"
              checked={depositConfirmed}
              onChange={(e) => setDepositConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span className="text-sm text-gray-700">
              Saya faham deposit RM{Number(depositAmount).toFixed(0)} diperlukan sebelum tempahan disahkan terapis.
            </span>
          </label>
        </div>
      )}

      {detailsRevealed && error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-black/[0.05] bg-white/90 px-5 pb-4 pt-3 backdrop-blur-md sm:max-w-lg">
        {!detailsRevealed ? (
          <button
            type="button"
            onClick={() => setDetailsRevealed(true)}
            className="btn-primary flex w-full items-center justify-center gap-2"
            disabled={!slotId}
          >
            Seterusnya
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={submitting || !slotId || (depositRequired && !depositConfirmed)}
          >
            {submitting ? "Menghantar..." : (
              <>
                Tempah & Hantar ke WhatsApp
                <SendIcon className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
