import Link from "next/link";
import { WalletIcon, ClipboardListIcon, CalendarIcon, BriefcaseIcon, UsersIcon } from "@/components/icons";
import CountUp from "@/components/CountUp";
import SalesTrendChart from "@/components/SalesTrendChart";

type TrendPoint = { date: string; total: number };

// Balance-card style hero (inspired by finance-app dashboards): headline
// figure is the therapist's all-time total collected — same number as the
// old "Jumlah Terkumpul" stat tile — now given top billing plus a 7-day
// sparkline (SalesTrendChart, a client component for the hover tooltip) and
// one-tap shortcuts to the pages that actually drive sales.
export default function SalesHeroCard({
  token,
  totalCollected,
  customersServed,
  trend,
  lateCancellationCompensation = 0,
}: {
  token: string;
  totalCollected: number;
  customersServed: number;
  trend: TrendPoint[];
  lateCancellationCompensation?: number;
}) {
  const actions = [
    { label: "Tempahan", Icon: ClipboardListIcon, href: `/dashboard/${token}/bookings` },
    { label: "Slot", Icon: CalendarIcon, href: `/dashboard/${token}/slots` },
    { label: "Servis", Icon: BriefcaseIcon, href: `/dashboard/${token}/services` },
    { label: "Pelanggan", Icon: UsersIcon, href: `/dashboard/${token}/customers` },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-card-hover animate-pop-in"
      style={{ background: "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 70%, black))" }}
    >
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative flex items-center gap-1.5 text-xs font-semibold text-white/75">
        <WalletIcon className="h-3.5 w-3.5" />
        Jumlah Terkumpul
      </div>
      <p className="relative mt-1.5 text-[32px] font-bold leading-none">
        <CountUp value={totalCollected} prefix="RM" />
      </p>
      <p className="relative mt-1.5 text-xs text-white/70">{customersServed} pelanggan dilayan setakat ini</p>
      {lateCancellationCompensation > 0 && (
        <p className="relative mt-0.5 text-[11px] text-amber-200">+RM{lateCancellationCompensation.toFixed(0)} pampasan pembatalan lewat</p>
      )}

      <div className="relative mt-4">
        <SalesTrendChart trend={trend} />
      </div>

      <div className="relative mt-4 grid grid-cols-4 gap-1 border-t border-white/15 pt-3.5">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="card-tap flex flex-col items-center gap-1.5 rounded-xl py-1 text-center active:bg-white/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <a.Icon className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-medium text-white/85">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
