"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useEffect, useState } from "react";

export function CartIcon({ storeSlug, theme }: { storeSlug: string; theme?: any }) {
  const [mounted, setMounted] = useState(false);
  const getStoreItemCount = useCartStore((state) => state.getStoreItemCount);
  const count = getStoreItemCount(storeSlug);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link href={`/${storeSlug}/cart`} className="relative p-2">
      <ShoppingBag
        className="w-5 h-5"
        style={{ color: theme?.text_color || "#1a1a1a" }}
      />
      {/* Only show badge after client mount to avoid hydration mismatch */}
      {mounted && count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
          style={{ backgroundColor: theme?.accent_color || "#c9a96e" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}