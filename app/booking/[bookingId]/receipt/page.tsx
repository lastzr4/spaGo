import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import ReceiptUploadForm from "@/components/ReceiptUploadForm";

export const dynamic = "force-dynamic";

// Public, no-auth page — the booking's own cuid is the access token (same
// trust model as a therapist dashboardToken: unguessable, only known to
// whoever just made this specific booking). Reached from the booking
// success screen or the WhatsApp message.
export default async function ReceiptUploadPage({ params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { therapist: { select: { name: true, phone: true } }, service: { select: { name: true } } },
  });

  if (!booking) notFound();

  return (
    <>
      <TopBar title="Upload Resit Pembayaran" backHref="/" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-5 text-center">
          <p className="text-sm text-[color:var(--text-secondary)]">
            Tempahan {booking.service.name} dengan {booking.therapist.name}
          </p>
        </div>
        <ReceiptUploadForm
          bookingId={booking.id}
          therapistPhone={booking.therapist.phone}
          depositAmount={booking.depositAmountSnapshot ? Number(booking.depositAmountSnapshot) : null}
        />
      </main>
    </>
  );
}
