"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon, BriefcaseIcon, CalendarIcon, ClipboardListIcon, MessageSquareIcon } from "@/components/icons";

export default function BottomTabBar({ token }: { token: string }) {
  const pathname = usePathname();

  const items = [
    { key: "home", label: "Profil", href: `/dashboard/${token}`, Icon: UserIcon },
    { key: "services", label: "Servis", href: `/dashboard/${token}/services`, Icon: BriefcaseIcon },
    { key: "slots", label: "Slot", href: `/dashboard/${token}/slots`, Icon: CalendarIcon },
    { key: "bookings", label: "Tempahan", href: `/dashboard/${token}/bookings`, Icon: ClipboardListIcon },
    { key: "reviews", label: "Ulasan", href: `/dashboard/${token}/reviews`, Icon: MessageSquareIcon },
  ] as const;

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 mt-auto flex border-t border-black/[0.04] bg-white/95 shadow-nav backdrop-blur-md">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-transform active:scale-95"
          >
            <item.Icon
              className={`h-5 w-5 transition-colors ${active ? "nav-active" : "text-gray-400"}`}
              strokeWidth={active ? 2.2 : 1.9}
            />
            <span className={`text-[11px] font-medium transition-colors ${active ? "nav-active" : "text-gray-400"}`}>
              {item.label}
            </span>
            <span className={`h-1 w-1 rounded-full transition-colors ${active ? "nav-active-dot" : "bg-transparent"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
