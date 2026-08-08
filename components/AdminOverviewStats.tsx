import Link from "next/link";
import { UserIcon, WalletIcon, ClockIcon, CheckCircleIcon, ClipboardListIcon, MessageSquareIcon, ChevronRightIcon } from "@/components/icons";
import CountUp from "@/components/CountUp";

export default function AdminOverviewStats({
  totalTherapists,
  activeTherapists,
  demoTherapists,
  pendingBookings,
  completedBookings,
  totalBookings,
  totalRevenue,
  totalReviews,
}: {
  totalTherapists: number;
  activeTherapists: number;
  demoTherapists: number;
  pendingBookings: number;
  completedBookings: number;
  totalBookings: number;
  totalRevenue: number;
  totalReviews: number;
}) {
  const stats = [
    {
      key: "therapists",
      label: "Jumlah Terapis",
      value: (
        <>
          <CountUp value={totalTherapists} /> <span className="text-sm font-semibold text-gray-400">({activeTherapists} aktif)</span>
        </>
      ),
      Icon: UserIcon,
      accent: "from-violet-400 to-purple-600",
      href: "/admin/therapists",
    },
    { key: "revenue", label: "Jumlah Terkumpul (Platform)", value: <CountUp value={totalRevenue} prefix="RM" />, Icon: WalletIcon, accent: "from-emerald-400 to-teal-600", href: "/admin/therapists" },
    { key: "pending", label: "Tempahan Menunggu", value: <CountUp value={pendingBookings} />, Icon: ClockIcon, accent: "from-amber-400 to-orange-500", href: "/admin/therapists" },
    { key: "completed", label: "Tempahan Selesai", value: <CountUp value={completedBookings} />, Icon: CheckCircleIcon, accent: "from-emerald-400 to-green-600", href: "/admin/therapists" },
    { key: "bookings", label: "Jumlah Tempahan", value: <CountUp value={totalBookings} />, Icon: ClipboardListIcon, accent: "from-sky-400 to-blue-600", href: "/admin/therapists" },
    { key: "reviews", label: "Jumlah Ulasan", value: <CountUp value={totalReviews} />, Icon: MessageSquareIcon, accent: "from-pink-400 to-rose-600", href: "/admin/therapists" },
  ] as const;

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <Link
            key={s.key}
            href={s.href}
            className="card card-tap group relative animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <ChevronRightIcon className="absolute right-3 top-3 h-3.5 w-3.5 text-gray-300 transition-transform group-active:translate-x-0.5" />
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)] ${s.accent}`}>
              <s.Icon className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-brand-900">{s.value}</p>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>
      {demoTherapists > 0 && (
        <p className="mt-4 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-400">
          {demoTherapists} terapis demo tidak dikira dalam statistik di atas.
        </p>
      )}
    </div>
  );
}
