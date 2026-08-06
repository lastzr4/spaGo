import { UserIcon, WalletIcon, ClockIcon, CalendarIcon, StarIcon, BriefcaseIcon } from "@/components/icons";

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
      value: customersServed.toString(),
      Icon: UserIcon,
      accent: "bg-brand-50 text-brand-600",
    },
    {
      key: "collected",
      label: "Jumlah Terkumpul",
      value: `RM${totalCollected.toFixed(0)}`,
      Icon: WalletIcon,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "pending",
      label: "Menunggu Tindakan",
      value: pendingCount.toString(),
      Icon: ClockIcon,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      key: "upcoming",
      label: "Akan Datang",
      value: confirmedUpcoming.toString(),
      Icon: CalendarIcon,
      accent: "bg-brand-50 text-brand-600",
    },
    {
      key: "rating",
      label: "Rating Purata",
      value: averageRating != null ? `${averageRating.toFixed(1)} (${reviewCount})` : "Belum ada",
      Icon: StarIcon,
      accent: "bg-yellow-50 text-yellow-600",
    },
    {
      key: "services",
      label: "Servis Aktif",
      value: activeServicesCount.toString(),
      Icon: BriefcaseIcon,
      accent: "bg-brand-50 text-brand-600",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={s.key} className="card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
          <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.accent}`}>
            <s.Icon className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-brand-900">{s.value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
