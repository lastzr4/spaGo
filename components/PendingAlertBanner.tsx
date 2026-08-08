import Link from "next/link";
import { ClockIcon, ChevronRightIcon } from "@/components/icons";

export default function PendingAlertBanner({ token, pendingCount }: { token: string; pendingCount: number }) {
  if (pendingCount <= 0) return null;

  return (
    <Link
      href={`/dashboard/${token}/bookings?status=PENDING`}
      className="card-tap mb-5 flex animate-fade-in items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
    >
      <div className="animate-pulse-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
        <ClockIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">
          {pendingCount} tempahan menunggu tindakan anda
        </p>
        <p className="text-xs text-amber-700/80">Sahkan atau batalkan secepat mungkin</p>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-amber-500" />
    </Link>
  );
}
