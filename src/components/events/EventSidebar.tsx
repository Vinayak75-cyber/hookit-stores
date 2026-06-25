"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EventSidebarProps {
  eventStoreSlug: string;
  eventStoreName: string;
}

export default function EventSidebar({
  eventStoreSlug,
  eventStoreName,
}: EventSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: "Overview",
      href: `/event-dashboard/${eventStoreSlug}`,
      icon: LayoutDashboard,
    },
    {
      label: "Events",
      href: `/event-dashboard/${eventStoreSlug}/events`,
      icon: CalendarDays,
    },
    {
      label: "Tickets",
      href: `/event-dashboard/${eventStoreSlug}/tickets`,
      icon: Ticket,
    },
    {
      label: "Attendees",
      href: `/event-dashboard/${eventStoreSlug}/attendees`,
      icon: Users,
    },
    {
      label: "Payouts",
      href: `/event-dashboard/${eventStoreSlug}/payouts`,
      icon: CreditCard,
    },
    {
      label: "Settings",
      href: `/event-dashboard/${eventStoreSlug}/settings`,
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/event-dashboard/${eventStoreSlug}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#e5e5e5] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e5e5e5]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#1a1a1a]">hookit</span>
        </Link>
      </div>

      {/* Store Info */}
      <div className="px-5 py-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f5f5f5] rounded-xl flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-[#666666]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1a1a1a] truncate">
              {eventStoreName}
            </p>
            <p className="text-xs text-[#999999] truncate">
              {eventStoreSlug}.hookit.online
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
              }`}
            >
              <item.icon className={`w-4 h-4 ${active ? "text-white" : "text-[#999999]"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-[#e5e5e5] space-y-1">
        <Link
          href={`/e/${eventStoreSlug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-all"
        >
          <Store className="w-4 h-4 text-[#999999]" />
          View Store
          <span className="ml-auto text-[#999999]">→</span>
        </Link>
        <button
          onClick={() => {
            // Sign out logic
            router.push("/login");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-all"
        >
          <LogOut className="w-4 h-4 text-[#999999]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}