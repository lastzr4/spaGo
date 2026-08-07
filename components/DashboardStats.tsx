import { UserIcon, WalletIcon, ClockIcon, CalendarIcon, StarIcon, BriefcaseIcon } from "@/components/icons";
import CountUp from "@/components/CountUp";

export default function DashboardStats({
  customersServed,
  totalCollected,
  pendingCount,
  confirmedUpcoming,
  activeServicesCount,
  averageRating,
  reviewCount,
}: {
  customersServed: number;
  totalCollected: number;
  pendingCount: number;
  confirmedUpcoming: number;
  activeServicesCount: number;
  averageRating: number | null;
  reviewCount: number;
}) {
  const stats = [
    {
      key: "customers",
      label: "Pelanggan Dijumpai",
      value: <CountUp value={customersServed} />,
      Icon: UserIcon,
      accent: "from-violet-400 to-purple-600",
    },
    {
      key: "collected",
      label: "Jumlah Terkumpul",
      value: <CountUp value={totalCollected} prefix="RM" />,
      Icon: WalletIcon,
      accent: "from-emerald-400 to-teal-600",
    },
    {
      key: "pending",
      label: "Menunggu Tindakan",
      value: <CountUp value={pendingCount} />,
      Icon: ClockIcon,
      accent: "from-amber-400 to-orange-500",
    },
    {
      key: "upcoming",
      label: "Akan Datang",
      value: <CountUp value={confirmedUpcoming} />,
      Icon: CalendarIcon,
      accent: "from-sky-400 to-blue-600",
    },
    {
      key: "rating",
      label: "Rating Purata",
      value: averageRating != null ? `${averageRating.toFixed(1)} (${reviewCount})` : "Belum ada",
      Icon: StarIcon,
      accent: "from-yellow-400 to-amber-500",
    },
    {
      key: "services",
      label: "Servis Aktif",
      value: <CountUp value={activeServicesCount} />,
      Icon: BriefcaseIcon,
      accent: "from-pink-400 to-rose-600",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={s.key} className="card card-tap animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
          <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)] ${s.accent}`}>
            <s.Icon className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-brand-900">{s.value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
