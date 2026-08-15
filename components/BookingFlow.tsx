"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildWhatsAppBookingMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { haversineKm, buildGoogleMapsDirectionsUrl, computeTravelFee } from "@/lib/geo";
import { buildHealthDeclarationStatements } from "@/lib/consent";
import { CheckCircleIcon, SendIcon, CalendarIcon, AlertTriangleIcon, QrIcon, CashIcon, WalletIcon, ChevronRightIcon, ClipboardListIcon, EyeIcon } from "@/components/icons";
import Confetti from "@/components/Confetti";
import ServiceDetailSheet from "@/components/ServiceDetailSheet";
import ServiceBadgeRibbon from "@/components/ServiceBadgeRibbon";
import { isPastSlot } from "@/lib/slotTimes";
import { slotsNeededFor, findConsecutiveAvailableSlots } from "@/lib/slotOverlap";
import { SERVICE_BADGES, ServiceBadge, hasPromo } from "@/lib/pricing";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
  photoUrl?: string | null;
  description?: string | null;
  promoPrice?: string | null;
  badge?: string | null;
  isPackage?: boolean;
  packageItems?: { id: string; name: string; durationMinutes: number; price: string }[];
};
type Slot = { id: string; date: string; startTime: string; endTime: string };

const WEEKDAY = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

function formatDatePill(d: string) {
  const date = new Date(d + "T00:00:00");
  return { weekday: WEEKDAY[date.getDay()], day: date.getDate(), month: MONTH[date.getMonth()] };
}

export default function BookingFlow({
  therapistId,
  therapistName,
  therapistPhone,
  therapistRating = null,
  therapistReviewCount = 0,
  therapistBaseLat = null,
  therapistBaseLng = null,
  services,
  slots,
  customerGender,
  depositRequired = false,
  depositAmount = null,
  paymentMethod = null,
  qrCodeUrl = null,
  extraChargesNote = null,
  cancellationWindowHours = 2,
  travelFeeEnabled = false,
  travelFreeRadiusKm = 5,
  travelRatePerKm = 1,
}: {
  therapistId: string;
  therapistName: string;
  therapistPhone: string;
  therapistRating?: number | null;
  therapistReviewCount?: number;
  // Therapist's base location (set once in their dashboard) — used to show
  // an estimated distance + Google Maps link in the WhatsApp booking
  // message, so the therapist can decide upfront whether to commit or
  // charge extra for far bookings. Free straight-line estimate, no paid
  // geocoding/directions API involved.
  therapistBaseLat?: number | null;
  therapistBaseLng?: number | null;
  services: Service[];
  slots: Slot[];
  customerGender: "MALE" | "FEMALE";
  depositRequired?: boolean;
  depositAmount?: string | null;
  paymentMethod?: "QR" | "CASH" | "TOYYIBPAY" | null;
  qrCodeUrl?: string | null;
  extraChargesNote?: string | null;
  cancellationWindowHours?: number;
  // Dynamic travel fee: computed from GPS distance, shown to the customer
  // and requires their explicit agreement before submitting — never
  // silently applied. Off by default (therapist must opt in).
  travelFeeEnabled?: boolean;
  travelFreeRadiusKm?: number;
  travelRatePerKm?: number;
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
  const [healthConsentAccepted, setHealthConsentAccepted] = useState(false);
  const [travelFeeConfirmed, setTravelFeeConfirmed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [justBooked, setJustBooked] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);
  const [bookedWhatsappLink, setBookedWhatsappLink] = useState<string | null>(null);
  const [depositPaymentUrl, setDepositPaymentUrl] = useState<string | null>(null);
  const [detailsRevealed, setDetailsRevealed] = useState(false);
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [locationAttempted, setLocationAttempted] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const slotSectionRef = useRef<HTMLDivElement>(null);
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
  // Slots are generic fixed 1-hour blocks — a service longer than that needs
  // several consecutive ones blocked off, not just its own start time.
  const slotsNeeded = selectedService ? slotsNeededFor(selectedService.durationMinutes) : 1;

  // A previously-picked slot can stop being valid if the customer switches
  // to a longer service afterwards — clear it so they don't submit a start
  // time that no longer has enough room behind it.
  useEffect(() => {
    setSlotId("");
  }, [serviceId]);

  // Computed reactively (not just at submit time) so it can be shown in the
  // booking summary before the customer commits — the whole point is
  // advance disclosure + explicit agreement, never a surprise charge after
  // the fact.
  const distanceKm =
    therapistBaseLat != null && therapistBaseLng != null && customerLat != null && customerLng != null
      ? haversineKm(therapistBaseLat, therapistBaseLng, customerLat, customerLng)
      : null;
  const travelFee = travelFeeEnabled && distanceKm != null ? computeTravelFee(distanceKm, travelFreeRadiusKm, travelRatePerKm) : null;

  useEffect(() => {
    if (detailsRevealed) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Best-effort GPS capture — silent, no error shown if denied/unavailable.
      // Lets the therapist see an estimated distance in the WhatsApp message;
      // the text address field above still works fine without it.
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCustomerLat(pos.coords.latitude);
            setCustomerLng(pos.coords.longitude);
            setLocationAttempted(true);
          },
          () => setLocationAttempted(true),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setLocationAttempted(true);
      }
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
          customerLat,
          customerLng,
          customerGender,
          referralCodeUsed: referralCode || undefined,
          healthConsentAccepted,
          travelFeeConfirmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "SLOT_UNAVAILABLE"
            ? "Slot ini baru sahaja ditempah orang lain. Sila pilih slot lain."
            : data.error === "NOT_ENOUGH_CONSECUTIVE_SLOTS"
              ? "Slot berturut-turut yang diperlukan untuk servis ini baru sahaja ditempah orang lain. Sila pilih slot lain."
              : "Tempahan gagal. Sila cuba lagi."
        );
        setSubmitting(false);
        return;
      }

      const hasTherapistBase = therapistBaseLat != null && therapistBaseLng != null;
      const hasCustomerGps = customerLat != null && customerLng != null;
      const mapsUrl = hasTherapistBase
        ? buildGoogleMapsDirectionsUrl({ lat: therapistBaseLat!, lng: therapistBaseLng! }, hasCustomerGps ? { lat: customerLat!, lng: customerLng! } : address)
        : undefined;

      const message = buildWhatsAppBookingMessage({
        therapistName,
        customerName: name,
        serviceName: selectedService?.name ?? "",
        durationMinutes: selectedService?.durationMinutes ?? 0,
        date: selectedSlot?.date.slice(0, 10) ?? "",
        startTime: selectedSlot?.startTime ?? "",
        address,
        distanceKm: distanceKm ?? undefined,
        mapsUrl,
        travelFee: travelFee ?? undefined,
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
      setBookedId(data.booking?.id ?? null);
      setBookedWhatsappLink(link);
      setDepositPaymentUrl(data.depositPaymentUrl ?? null);
      // toyyibPay: go straight to the payment page — no extra tap needed,
      // that's the whole point of "online" deposit over the manual QR flow.
      // Manual QR/CASH deposits still need the customer to stay and act
      // (upload a receipt, or note the cash arrangement), and a no-deposit
      // booking auto-redirects to WhatsApp same as before.
      if (paymentMethod === "TOYYIBPAY" && data.depositPaymentUrl) {
        setTimeout(() => {
          window.location.href = data.depositPaymentUrl;
        }, 900);
      } else if (!depositRequired) {
        setTimeout(() => {
          window.location.href = link;
        }, 1100);
      }
    } catch {
      setError("Tempahan gagal. Sila cuba lagi.");
      setSubmitting(false);
    }
  }

  if (services.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-1 py-8 text-center">
        <p className="text-sm font-medium text-[color:var(--text-secondary)]">Terapis ini belum menetapkan sebarang servis.</p>
      </div>
    );
  }

  if (justBooked) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-in">
        <Confetti />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
          <CheckCircleIcon filled className="h-8 w-8" />
        </div>
        <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Tempahan dihantar!</p>
        {depositRequired && paymentMethod === "TOYYIBPAY" ? (
          <>
            <p className="max-w-[260px] text-sm text-[color:var(--text-secondary)]">
              {depositPaymentUrl
                ? "Mengalihkan ke halaman pembayaran deposit..."
                : "Deposit tidak dapat dijana buat masa ini. Sila hubungi terapis melalui WhatsApp untuk susun bayaran."}
            </p>
            <div className="mt-2 flex w-full max-w-[280px] flex-col gap-2.5">
              {depositPaymentUrl ? (
                // No WhatsApp shortcut here on purpose — deposit gets paid
                // first, auto-redirect handles that in a moment. WhatsApp
                // only becomes available after payment (on the status page
                // toyyibPay redirects back to), so there's no way to skip
                // straight to messaging the therapist before paying.
                <a href={depositPaymentUrl} className="btn-primary w-full">
                  Bayar Deposit Sekarang
                </a>
              ) : (
                bookedWhatsappLink && (
                  <a href={bookedWhatsappLink} className="btn-secondary w-full">
                    Buka WhatsApp
                  </a>
                )
              )}
            </div>
          </>
        ) : depositRequired ? (
          <>
            <p className="max-w-[260px] text-sm text-[color:var(--text-secondary)]">
              Selesaikan bayaran deposit, kemudian upload resit di sini supaya terapis dapat sahkan tempahan anda.
            </p>
            <div className="mt-2 flex w-full max-w-[280px] flex-col gap-2.5">
              {bookedId && (
                <Link href={`/booking/${bookedId}/receipt`} className="btn-primary w-full">
                  Upload Resit Pembayaran
                </Link>
              )}
              {bookedWhatsappLink && (
                <a href={bookedWhatsappLink} className="btn-secondary w-full">
                  Buka WhatsApp
                </a>
              )}
            </div>
          </>
        ) : (
          <p className="max-w-[240px] text-sm text-[color:var(--text-secondary)]">Membuka WhatsApp untuk sahkan dengan terapis...</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-24">
      {extraChargesNote && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/15 px-4 py-3 text-[13px] font-medium text-amber-400">
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>Caj tambahan mungkin dikenakan: {extraChargesNote}</span>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-[15px] font-bold text-[color:var(--text-primary)]">Pilih servis</h2>
        <div className="flex flex-col gap-2.5">
          {services.map((s) => {
            const active = serviceId === s.id;
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setServiceId(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setServiceId(s.id);
                  }
                }}
                className={`card-tap flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  active ? "border-brand-500 bg-[color:var(--surface-2)]/70 shadow-card" : "border-[color:var(--border)] bg-[color:var(--surface-2)]"
                }`}
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt={s.name} className="h-12 w-12 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center bg-brand-100 text-[11px] font-medium text-brand-400">
                      Foto
                    </span>
                  )}
                  {s.badge && SERVICE_BADGES.includes(s.badge as ServiceBadge) && (
                    <ServiceBadgeRibbon badge={s.badge as ServiceBadge} size="sm" />
                  )}
                </span>
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="block truncate font-semibold text-[color:var(--text-primary)]">{s.name}</span>
                      {s.isPackage && (
                        <span className="rounded-full bg-[color:var(--surface)] px-1.5 py-0.5 text-[9px] font-bold text-brand-500">Pakej</span>
                      )}
                    </span>
                    <span className="block text-xs text-[color:var(--text-secondary)]">{s.durationMinutes} minit</span>
                    {s.isPackage && s.packageItems && s.packageItems.length > 0 && (
                      <span className="block truncate text-[11px] text-[color:var(--text-muted)]">
                        Termasuk: {s.packageItems.map((p) => p.name).join(", ")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailService(s);
                      }}
                      className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-brand-600 active:opacity-60"
                    >
                      <EyeIcon className="h-3 w-3" />
                      Butiran
                    </button>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-semibold text-brand-700">
                    {hasPromo(s.price, s.promoPrice) ? (
                      <span className="flex items-baseline gap-1">
                        <span className="text-[11px] font-medium text-[color:var(--text-muted)] line-through">RM{Number(s.price).toFixed(0)}</span>
                        <span>RM{Number(s.promoPrice).toFixed(0)}</span>
                      </span>
                    ) : (
                      <>RM{Number(s.price).toFixed(0)}</>
                    )}
                    {active && <CheckCircleIcon filled className="h-4 w-4 text-brand-600" />}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={slotSectionRef} className="scroll-mt-5">
        <h2 className="mb-1 flex items-center gap-1.5 text-[15px] font-bold text-[color:var(--text-primary)]">
          <CalendarIcon className="h-4 w-4 text-brand-500" />
          Pilih slot masa
        </h2>
        {slotsNeeded > 1 && (
          <p className="mb-3 text-xs text-[color:var(--text-secondary)]">
            Servis ini ({selectedService?.durationMinutes} minit) perlukan {slotsNeeded} slot berturut-turut — slot yang tidak cukup ruang selepasnya dikelabukan.
          </p>
        )}
        {dates.length === 0 ? (
          <div className="card flex flex-col items-center gap-1 py-8 text-center">
            <p className="text-sm font-medium text-[color:var(--text-secondary)]">Tiada slot kosong buat masa ini.</p>
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
                      active ? "bg-brand-600 text-white shadow-card" : "bg-[color:var(--surface-2)] text-brand-700"
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
                const notEnoughRoom = !past && slotsNeeded > 1 && !findConsecutiveAvailableSlots(slots, s, slotsNeeded);
                const disabled = past || notEnoughRoom;
                return (
                  <button
                    type="button"
                    key={s.id}
                    disabled={disabled}
                    title={notEnoughRoom ? `Tidak cukup slot berturut-turut untuk servis ${slotsNeeded} jam ini` : undefined}
                    onClick={() => setSlotId(s.id)}
                    className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                      disabled
                        ? "cursor-not-allowed border-transparent bg-[color:var(--surface)] text-[color:var(--text-muted)] opacity-40 line-through"
                        : `active:scale-[0.96] ${
                            slotId === s.id
                              ? "border-brand-600 bg-brand-600 text-white shadow-card"
                              : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]"
                          }`
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

      {selectedService && selectedSlot && (
        <div className="card animate-fade-in">
          <h2 className="mb-1 text-[15px] font-bold text-[color:var(--text-primary)]">Ringkasan tempahan</h2>
          <div className="detail-row">
            <span className="text-[color:var(--text-secondary)]">Servis</span>
            <span className="truncate pl-3 text-right font-semibold text-[color:var(--text-primary)]">{selectedService.name}</span>
          </div>
          <div className="detail-row">
            <span className="text-[color:var(--text-secondary)]">Tarikh &amp; masa</span>
            <span className="font-semibold text-[color:var(--text-primary)]">
              {(() => {
                const { weekday, day, month } = formatDatePill(selectedSlot.date.slice(0, 10));
                return `${weekday}, ${day} ${month} · ${selectedSlot.startTime}`;
              })()}
            </span>
          </div>
          <div className="detail-row">
            <span className="text-[color:var(--text-secondary)]">Tempoh</span>
            <span className="font-semibold text-[color:var(--text-primary)]">{selectedService.durationMinutes} minit</span>
          </div>
          <div className="detail-row">
            <span className="text-[color:var(--text-secondary)]">Harga</span>
            {hasPromo(selectedService.price, selectedService.promoPrice) ? (
              <span className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-[color:var(--text-muted)] line-through">RM{Number(selectedService.price).toFixed(0)}</span>
                <span className="font-bold text-brand-500">RM{Number(selectedService.promoPrice).toFixed(0)}</span>
              </span>
            ) : (
              <span className="font-bold text-brand-500">RM{Number(selectedService.price).toFixed(0)}</span>
            )}
          </div>
          {travelFeeEnabled && detailsRevealed && (
            <div className="detail-row">
              <span className="text-[color:var(--text-secondary)]">Caj Perjalanan{distanceKm != null ? ` (~${distanceKm.toFixed(1)} km)` : ""}</span>
              <span className="font-semibold text-[color:var(--text-primary)]">
                {distanceKm != null
                  ? travelFee && travelFee > 0
                    ? `RM${travelFee}`
                    : "Percuma"
                  : locationAttempted
                    ? "Akan dibincang dengan terapis"
                    : "Mengira lokasi..."}
              </span>
            </div>
          )}
        </div>
      )}

      {detailsRevealed && (
      <div ref={detailsRef} className="flex animate-fade-in flex-col gap-3 scroll-mt-5">
        <h2 className="text-[15px] font-bold text-[color:var(--text-primary)]">Maklumat anda</h2>
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
        <div className="rounded-2xl border border-brand-100 bg-[color:var(--surface-2)]/60 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-brand-600">
              {paymentMethod === "CASH" ? (
                <CashIcon className="h-4 w-4" />
              ) : paymentMethod === "TOYYIBPAY" ? (
                <WalletIcon className="h-4 w-4" />
              ) : (
                <QrIcon className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Deposit RM{Number(depositAmount).toFixed(0)} diperlukan</p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {paymentMethod === "CASH"
                  ? "Dibayar tunai semasa terapis tiba."
                  : paymentMethod === "TOYYIBPAY"
                    ? "Bayar terus dalam talian (FPX/kad) selepas tempahan — disahkan automatik."
                    : "Butiran pembayaran akan diberikan terapis melalui WhatsApp selepas tempahan."}
              </p>
            </div>
          </div>

          {paymentMethod === "QR" && qrCodeUrl && (
            <>
              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                className="btn-ghost mt-3 w-full justify-center bg-[color:var(--surface-2)] text-xs"
              >
                {showQr ? "Sembunyikan kod QR" : "Lihat kod QR sekarang"}
              </button>
              {showQr && (
                <div className="mt-3 flex flex-col items-center gap-2 animate-fade-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="Kod QR pembayaran" className="h-40 w-40 rounded-xl border border-[color:var(--border)] object-cover" />
                </div>
              )}
            </>
          )}

          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/15 px-3.5 py-2.5 text-xs font-medium text-amber-400">
            <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Pembatalan tempahan yang telah disahkan kurang daripada {cancellationWindowHours} jam sebelum sesi akan menyebabkan deposit tidak dikembalikan, sebagai pampasan masa &amp; perjalanan terapis.
          </p>

          <label className="mt-3 flex items-start gap-2.5 rounded-xl bg-[color:var(--surface-2)] px-3.5 py-3">
            <input
              type="checkbox"
              checked={depositConfirmed}
              onChange={(e) => setDepositConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span className="text-sm text-[color:var(--text-secondary)]">
              Saya faham deposit RM{Number(depositAmount).toFixed(0)} diperlukan sebelum tempahan disahkan terapis.
            </span>
          </label>
        </div>
      )}

      {detailsRevealed && (
        <div className="rounded-2xl border border-brand-100 bg-[color:var(--surface-2)]/60 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-brand-600">
              <ClipboardListIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Pengisytiharan Kesihatan</p>
              <p className="text-xs text-[color:var(--text-secondary)]">Sila baca dan sahkan sebelum tempahan diteruskan.</p>
            </div>
          </div>

          <ul className="mt-3 flex flex-col gap-1.5 text-xs text-[color:var(--text-secondary)]">
            {buildHealthDeclarationStatements(customerGender).map((statement, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-500">•</span>
                <span>{statement}</span>
              </li>
            ))}
          </ul>

          <label className="mt-3 flex items-start gap-2.5 rounded-xl bg-[color:var(--surface-2)] px-3.5 py-3">
            <input
              type="checkbox"
              checked={healthConsentAccepted}
              onChange={(e) => setHealthConsentAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span className="text-sm text-[color:var(--text-secondary)]">
              Saya bersetuju dengan penafian kesihatan di atas dan sah untuk menjalani sesi ini.
            </span>
          </label>
        </div>
      )}

      {detailsRevealed && travelFeeEnabled && distanceKm != null && travelFee != null && travelFee > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 animate-fade-in">
          <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Caj Perjalanan Tambahan</p>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
            Lokasi anda ~{distanceKm.toFixed(1)} km dari terapis, melebihi jarak percuma yang ditetapkan. Caj perjalanan RM{travelFee} dikira secara automatik berdasarkan jarak ini.
          </p>
          <label className="mt-3 flex items-start gap-2.5 rounded-xl bg-[color:var(--surface-2)] px-3.5 py-3">
            <input
              type="checkbox"
              checked={travelFeeConfirmed}
              onChange={(e) => setTravelFeeConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span className="text-sm text-[color:var(--text-secondary)]">
              Saya faham dan bersetuju dengan caj perjalanan tambahan RM{travelFee} ini.
            </span>
          </label>
        </div>
      )}

      {detailsRevealed && error && (
        <p className="rounded-xl bg-red-500/15 px-3.5 py-2.5 text-sm font-medium text-red-400">{error}</p>
      )}

      <div className="safe-bottom sticky bottom-0 z-20 -mx-5 border-t border-[color:var(--border)] bg-[rgba(26,18,48,0.9)] px-5 pb-4 pt-3 backdrop-blur-md">
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
            disabled={
              submitting ||
              !slotId ||
              (depositRequired && !depositConfirmed) ||
              !healthConsentAccepted ||
              (travelFeeEnabled && travelFee != null && travelFee > 0 && !travelFeeConfirmed)
            }
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

      {detailService && (
        <ServiceDetailSheet
          service={detailService}
          therapistRating={therapistRating}
          therapistReviewCount={therapistReviewCount}
          depositRequired={depositRequired}
          depositAmount={depositAmount}
          paymentMethod={paymentMethod}
          onClose={() => setDetailService(null)}
          onBook={() => {
            setServiceId(detailService.id);
            setDetailService(null);
            setTimeout(() => slotSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
          }}
        />
      )}
    </form>
  );
}
