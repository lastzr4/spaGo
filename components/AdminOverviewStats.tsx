import { UserIcon, WalletIcon, ClockIcon, CheckCircleIcon, ClipboardListIcon, MessageSquareIcon } from "@/components/icons";

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
    { key: "therapists", label: "Jumlah Terapis", value: `${totalTherapists} (${activeTherapists} aktif)`, Icon: UserIcon, accent: "bg-brand-50 text-brand-600" },
    { key: "revenue", label: "Jumlah Terkumpul (Platform)", value: `RM${totalRevenue.toFixed(0)}`, Icon: WalletIcon, accent: "bg-emerald-50 text-emerald-600" },
    { key: "pending", label: "Tempahan Menunggu", value: pendingBookings.toString(), Icon: ClockIcon, accent: "bg-amber-50 text-amber-600" },
    { key: "completed", label: "Tempahan Selesai", value: completedBookings.toString(), Icon: CheckCircleIcon, accent: "bg-emerald-50 text-emerald-600" },
    { key: "bookings", label: "Jumlah Tempahan", value: totalBookings.toString(), Icon: ClipboardListIcon, accent: "bg-brand-50 text-brand-600" },
    { key: "reviews", label: "Jumlah Ulasan", value: totalReviews.toString(), Icon: MessageSquareIcon, accent: "bg-yellow-50 text-yellow-600" },
  ] as const;

  return (
    <div className="px-5 py-5">
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
      {demoTherapists > 0 && (
        <p className="mt-4 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-400">
          {demoTherapists} terapis demo tidak dikira dalam statistik di atas.
        </p>
      )}
    </div>
  );
}
