import Link from "next/link";
import { AlertTriangleIcon, ChevronRightIcon } from "@/components/icons";
import type { ScheduleConflict } from "@/lib/dashboardStats";

const WEEKDAY = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return `${WEEKDAY[date.getDay()]}, ${date.getDate()} ${MONTH[date.getMonth()]}`;
}

export default function ScheduleConflictBanner({ token, conflicts }: { token: string; conflicts: ScheduleConflict[] }) {
  if (conflicts.length === 0) return null;

  return (
    <Link
      href={`/dashboard/${token}/bookings?status=CONFIRMED`}
      className="card-tap mb-5 flex animate-fade-in flex-col gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-rose-500 text-white">
          <AlertTriangleIcon className="h-4 w-4" />
        </div>
        <p className="flex-1 text-sm font-bold text-red-800">
          {conflicts.length} jadual terlalu rapat waktu
        </p>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-red-400" />
      </div>
      <div className="flex flex-col gap-1.5 pl-11">
        {conflicts.slice(0, 3).map((c, i) => (
          <p key={i} className="text-xs leading-relaxed text-red-700">
            {formatDate(c.date)}: <span className="font-medium">{c.firstCustomerName}</span> (habis {c.firstEndTime}) →{" "}
            <span className="font-medium">{c.secondCustomerName}</span> (mula {c.secondStartTime}) — hanya {Math.max(c.gapMinutes, 0)} min jarak
          </p>
        ))}
        {conflicts.length > 3 && <p className="text-xs font-semibold text-red-600">+{conflicts.length - 3} lagi</p>}
      </div>
    </Link>
  );
}
