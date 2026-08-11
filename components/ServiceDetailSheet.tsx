import { ChevronLeftIcon, ClockIcon, StarIcon, QrIcon, CashIcon } from "@/components/icons";
import QuickInfoRow from "@/components/QuickInfoRow";

type Service = { id: string; name: string; durationMinutes: number; price: string; photoUrl?: string | null; description?: string | null };

// Package-details bottom sheet (Spafy-style): large hero image, price, a
// quick-info amenities row, description, and a sticky "Tempah Sekarang" CTA
// that hands off to the existing slot-picking flow below.
export default function ServiceDetailSheet({
  service,
  therapistRating = null,
  therapistReviewCount = 0,
  depositRequired = false,
  depositAmount = null,
  paymentMethod = null,
  previewOnly = false,
  onClose,
  onBook,
}: {
  service: Service;
  therapistRating?: number | null;
  therapistReviewCount?: number;
  depositRequired?: boolean;
  depositAmount?: string | null;
  paymentMethod?: "QR" | "CASH" | null;
  // Therapist-side "how does this look to customers?" preview — same sheet,
  // minus the booking CTA (there's nothing to book from the dashboard).
  previewOnly?: boolean;
  onClose: () => void;
  onBook?: () => void;
}) {
  const items = [
    { icon: <ClockIcon className="h-4 w-4" />, label: "Tempoh", value: `${service.durationMinutes} minit` },
    ...(therapistRating != null
      ? [{ icon: <StarIcon filled className="h-4 w-4 text-yellow-400" />, label: "Rating terapis", value: `${therapistRating.toFixed(1)} (${therapistReviewCount})` }]
      : []),
    {
      icon: paymentMethod === "CASH" ? <CashIcon className="h-4 w-4" /> : <QrIcon className="h-4 w-4" />,
      label: "Deposit",
      value: depositRequired && depositAmount ? `RM${Number(depositAmount).toFixed(0)}` : "Tiada",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-modal-in flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-[color:var(--surface)] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0" style={{ aspectRatio: "16 / 10" }}>
          {service.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.photoUrl} alt={service.name} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-white/70"
              style={{ background: "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 75%, black))" }}
            >
              <span className="text-sm font-medium">SpaGo</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md active:scale-90"
            aria-label="Tutup"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          {previewOnly && (
            <span className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              Pratonton pelanggan
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{service.name}</h2>
            <span className="shrink-0 text-lg font-bold text-brand-500">RM{Number(service.price).toFixed(0)}</span>
          </div>

          <div className="mt-3">
            <QuickInfoRow items={items} />
          </div>

          {service.description && (
            <div className="mt-4">
              <h3 className="mb-1.5 text-sm font-bold text-[color:var(--text-primary)]">Penerangan</h3>
              <p className="text-[13px] leading-relaxed text-[color:var(--text-secondary)]">{service.description}</p>
            </div>
          )}
        </div>

        <div className="safe-bottom shrink-0 border-t border-[color:var(--border)] px-5 pb-4 pt-3">
          {previewOnly ? (
            <button type="button" onClick={onClose} className="btn-secondary w-full">
              Tutup Pratonton
            </button>
          ) : (
            <button type="button" onClick={onBook} className="btn-primary w-full">
              Tempah Sekarang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
