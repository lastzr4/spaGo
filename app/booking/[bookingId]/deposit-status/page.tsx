import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import { CheckCircleIcon, AlertTriangleIcon, ClockIcon } from "@/components/icons";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Public, no-auth page — same trust model as the receipt upload page (the
// booking's own cuid is the access token). toyyibPay redirects the
// customer's browser here after they finish (or abandon) payment on its
// own site — status_id in the query string reflects what just happened,
// while the DB status reflects what the server-to-server callback has
// actually confirmed (usually the same, but the callback can lag a beat
// behind the redirect).
export default async function DepositStatusPage({
  params,
  searchParams,
}: {
  params: { bookingId: string };
  searchParams: { status_id?: string };
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { therapist: { select: { name: true, phone: true } }, service: { select: { name: true } } },
  });
  if (!booking) notFound();

  // Prefer the confirmed DB status (from the callback) once it's landed;
  // fall back to the redirect's own status_id for the brief window before
  // the callback arrives.
  const status =
    booking.toyyibpayPaymentStatus === "PAID"
      ? "PAID"
      : booking.toyyibpayPaymentStatus === "FAILED"
        ? "FAILED"
        : searchParams.status_id === "1"
          ? "PAID"
          : searchParams.status_id === "3"
            ? "FAILED"
            : "PENDING";

  const message = `Salam ${booking.therapist.name}! Saya (${booking.customerName}) baru bayar deposit untuk tempahan ${booking.service.name} melalui toyyibPay.`;
  const whatsappLink = buildWhatsAppLink(booking.therapist.phone, message);

  return (
    <>
      <TopBar title="Status Pembayaran" backHref="/" />
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        {status === "PAID" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <CheckCircleIcon filled className="h-8 w-8" />
            </div>
            <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Deposit berjaya dibayar!</p>
            <p className="max-w-[260px] text-sm text-[color:var(--text-secondary)]">
              Terapis telah dimaklumkan. Tempahan anda akan disahkan sebentar lagi.
            </p>
          </>
        )}
        {status === "PENDING" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
              <ClockIcon className="h-8 w-8" />
            </div>
            <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Pembayaran sedang diproses</p>
            <p className="max-w-[260px] text-sm text-[color:var(--text-secondary)]">
              Jika anda sudah selesaikan pembayaran, sila tunggu sebentar — status akan dikemaskini secara automatik.
            </p>
          </>
        )}
        {status === "FAILED" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <AlertTriangleIcon className="h-8 w-8" />
            </div>
            <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Pembayaran tidak berjaya</p>
            <p className="max-w-[260px] text-sm text-[color:var(--text-secondary)]">
              Sila hubungi terapis melalui WhatsApp untuk cuba lagi atau susun cara pembayaran lain.
            </p>
          </>
        )}
        <div className="mt-3 flex w-full max-w-[280px] flex-col gap-2.5">
          <a href={whatsappLink} className="btn-primary w-full">
            Buka WhatsApp
          </a>
          <Link href="/" className="btn-secondary w-full">
            Kembali ke Laman Utama
          </Link>
        </div>
      </main>
    </>
  );
}
