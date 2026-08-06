import Link from "next/link";

export default function DashboardNav({ token, active }: { token: string; active: "home" | "services" | "slots" | "bookings" | "reviews" }) {
  const items = [
    { key: "home", label: "Profil", href: `/dashboard/${token}` },
    { key: "services", label: "Servis", href: `/dashboard/${token}/services` },
    { key: "slots", label: "Slot", href: `/dashboard/${token}/slots` },
    { key: "bookings", label: "Tempahan", href: `/dashboard/${token}/bookings` },
    { key: "reviews", label: "Ulasan", href: `/dashboard/${token}/reviews` },
  ] as const;

  return (
    <nav className="mb-6 flex gap-1 rounded-xl bg-brand-50 p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex-1 rounded-lg px-2 py-2 text-center text-sm font-medium ${
            active === item.key ? "bg-white text-brand-700 shadow-sm" : "text-brand-500"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
