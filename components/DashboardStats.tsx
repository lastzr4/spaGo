import Link from "next/link";
import { UserIcon, WalletIcon, ClockIcon, CalendarIcon, StarIcon, BriefcaseIcon, ChevronRightIcon } from "@/components/icons";
import CountUp from "@/components/CountUp";

export default function DashboardStats({
  token,
  customersServed,
  totalCollected,
  pendingCount,
  confirmedUpcoming,
  activeServicesCount,
  averageRating,
  reviewCount,
}: {
  token: string;
  customersServed: number;
  totalCollected: number;
  pendingCount: number;
  confirmedUpcoming: number;
  activeServicesCount: number;
  averageRating: number | null;
  reviewCount: number;
}) {
  const needsAttention = pendingCount > 0;

  const stats = [
    {
      key: "customers",
      label: "Pelanggan Dijumpai",
      value: <CountUp value={customersServed} />,
      Icon: UserIcon,
      accent: "from-violet-400 to-purple-600",
      href: `/dashboard/${token}/bookings?status=COMPLETED`,
    },
    {
      key: "collected",
      label: "Jumlah Terkumpul",
      value: <CountUp value={totalCollected} prefix="RM" />,
      Icon: WalletIcon,
      accent: "from-emerald-400 to-teal-600",
      href: `/dashboard/${token}/bookings?status=COMPLETED`,
    },
    {
      key: "pending",
      label: "Menunggu Tindakan",
      value: <CountUp value={pendingCount} />,
      Icon: ClockIcon,
      accent: "from-amber-400 to-orange-500",
      href: `/dashboard/${token}/bookings?status=PENDING`,
      alert: needsAttention,
    },
    {
      key: "upcoming",
      label: "Akan Datang",
      value: <CountUp value={confirmedUpcoming} />,
      Icon: CalendarIcon,
      accent: "from-sky-400 to-blue-600",
      href: `/dashboard/${token}/bookings?status=CONFIRMED`,
    },
    {
      key: "rating",
      label: "Rating Purata",
      value: averageRating != null ? `${averageRating.toFixed(1)} (${reviewCount})` : "Belum ada",
      Icon: StarIcon,
      accent: "from-yellow-400 to-amber-500",
      href: `/dashboard/${token}/reviews`,
    },
    {
      key: "services",
      label: "Servis Aktif",
      value: <CountUp value={activeServicesCount} />,
      Icon: BriefcaseIcon,
      accent: "from-pink-400 to-rose-600",
      href: `/dashboard/${token}/services`,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <Link
          key={s.key}
          href={s.href}
          className={`card card-tap group relative animate-fade-in ${
            "alert" in s && s.alert ? "ring-2 ring-amber-300/70" : ""
          }`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {"alert" in s && s.alert && (
            <span className="animate-badge-blink absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
          )}
          {!("alert" in s && s.alert) && (
            <ChevronRightIcon className="absolute right-3 top-3 h-3.5 w-3.5 text-[color:var(--text-muted)] transition-transform group-active:translate-x-0.5" />
          )}
          <div
            className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)] ${s.accent} ${
              "alert" in s && s.alert ? "animate-pulse-ring" : ""
            }`}
          >
            <s.Icon className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-[color:var(--text-primary)]">{s.value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[color:var(--text-secondary)]">{s.label}</p>
        </Link>
      ))}
    </div>
  );
}
