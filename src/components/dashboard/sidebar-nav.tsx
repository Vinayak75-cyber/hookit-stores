"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  CreditCard,
  Calendar,
  Palette,
  Receipt,
} from "lucide-react";

export function SidebarNav({ storeSlug }: { storeSlug: string }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: `/dashboard/${storeSlug}`, icon: LayoutDashboard },
    { label: "Products", href: `/dashboard/${storeSlug}/products`, icon: Package },
    { label: "Orders", href: `/dashboard/${storeSlug}/orders`, icon: ShoppingCart },
    { label: "Analytics", href: `/dashboard/${storeSlug}/analytics`, icon: BarChart3 },
    { label: "Store Settings", href: `/dashboard/${storeSlug}/settings`, icon: Settings },
    { label: "Payments", href: `/dashboard/${storeSlug}/payments`, icon: CreditCard },
    { label: "Theme", href: `/dashboard/${storeSlug}/theme`, icon: Palette },
    { label: "Billing", href: `/dashboard/${storeSlug}/billing`, icon: Receipt },
  ];

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== `/dashboard/${storeSlug}`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-[#1a1a1a] text-white"
                : "text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
            }`}
          >
            <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#999999]"}`} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}