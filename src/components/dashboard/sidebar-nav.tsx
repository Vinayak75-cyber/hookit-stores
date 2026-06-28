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
  Palette,
  Receipt,
  Store,
  LogOut,
  ExternalLink,
  X,
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
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1">
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
      </div>
      <div className="mt-auto pt-4 border-t border-[#e5e5e5] space-y-1">
        <Link
          href={`/${storeSlug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-all"
        >
          <ExternalLink className="w-4 h-4 text-[#999999]" />
          View Store
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function MobileSidebarDrawer({
  storeSlug,
  storeName,
  isOpen,
  onClose,
}: {
  storeSlug: string;
  storeName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
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
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{storeName}</p>
                <p className="text-xs text-[#888888]">{storeSlug}.hookit.online</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] transition-colors"
            >
              <X className="w-4 h-4 text-[#666666]" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== `/dashboard/${storeSlug}`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#999999]"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Drawer Footer */}
          <div className="px-3 py-4 border-t border-[#e5e5e5] space-y-1">
            <Link
              href={`/${storeSlug}`}
              target="_blank"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-all"
            >
              <ExternalLink className="w-5 h-5 text-[#999999]" />
              View Store
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}