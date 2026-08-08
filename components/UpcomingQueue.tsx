"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, PhoneIcon, MapPinIcon, ClockIcon, SendIcon, AlertTriangleIcon } from "@/components/icons";
import { buildWhatsAppLink, buildWhatsAppReminderMessage } from "@/lib/whatsapp";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceName: string;
  durationMinutes: number;
  date: string;
  startTime: string;
  minutesUntil: number;
};

type Phase = "upcoming" | "dueSoon" | "overdue";

function getPhase(booking: Booking): Phase {
  // dueSoon covers "starting within the hour" AND "should currently be in
  // session" (time has passed but not yet past its own duration). Only once
  // we're past when the session should have ended do we call it overdue —
  // otherwise a booking from hours ago wrongly kept saying "starting soon".
  if (booking.minutesUntil > 60) return "upcoming";
  if (booking.minutesUntil >= -booking.durationMinutes) return "dueSoon";
  return "overdue";
}

function QueueRow({ booking, token, defaultOpen }: { booking: Booking; token: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const phase = getPhase(booking);

  const reminderLink = buildWhatsAppLink(
    booking.customerPhone,
    buildWhatsAppReminderMessage({
      customerName: booking.customerName,
      serviceName: booking.serviceName,
      startTime: booking.startTime,
      address: booking.customerAddress,
    })
  );

  const cardStyle =
    phase === "dueSoon"
      ? "border-amber-200 bg-amber-50"
      : phase === "overdue"
        ? "border-gray-200 bg-gray-50"
        : "border-blue-100 bg-white";

  const iconStyle =
    phase === "dueSoon"
      ? "animate-pulse-ring bg-white text-amber-500"
      : phase === "overdue"
        ? "bg-white text-gray-400"
        : "bg-blue-50 text-blue-600";

  const labelStyle = phase === "dueSoon" ? "font-semibold text-amber-600" : phase === "overdue" ? "font-semibold text-gray-500" : "text-gray-500";

  return (
    <div className={`rounded-2xl border p-3.5 ${cardStyle}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          {phase === "overdue" ? <AlertTriangleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">
            {booking.customerName} &middot; {booking.serviceName}
          </p>
          <p className={`text-xs ${labelStyle}`}>
            {phase === "dueSoon" && "Bermula tidak lama lagi · "}
            {phase === "overdue" && "Sepatutnya sudah selesai · "}
            {booking.date}, {booking.startTime}
          </p>
        </div>
        <ChevronLeftIcon className={`h-4 w-4 shrink-0 text-gray-300 transition-transform ${open ? "rotate-90" : "-rotate-90"}`} />
      </button>

      {open && (
        <div className="mt-3 flex animate-fade-in flex-col gap-2 border-t border-black/[0.05] pt-3">
          <a
            href={`tel:${booking.customerPhone}`}
            className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 active:scale-[0.98]"
          >
            <PhoneIcon className="h-4 w-4 shrink-0 text-blue-500" />
            {booking.customerPhone}
          </a>
          <div className="flex items-start gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-gray-600">
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            {booking.customerAddress}
          </div>
          <p className="px-1 text-xs text-gray-500">{booking.durationMinutes} minit</p>

          {phase === "overdue" ? (
            <a
              href={`/dashboard/${token}/bookings?status=CONFIRMED`}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Kemaskini Status Tempahan
            </a>
          ) : (
            <a
              href={reminderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              <SendIcon className="h-3.5 w-3.5" />
              Hantar Reminder WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function UpcomingQueue({ bookings, token }: { bookings: Booking[]; token: string }) {
  if (bookings.length === 0) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-blue-500">
        <CalendarIcon className="h-3.5 w-3.5" />
        Giliran Akan Datang
      </h2>
      <div className="flex flex-col gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 p-2.5">
        {bookings.map((b, i) => (
          <QueueRow key={b.id} booking={b} token={token} defaultOpen={i === 0 && getPhase(b) === "dueSoon"} />
        ))}
      </div>
    </div>
  );
}
