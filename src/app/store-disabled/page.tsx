"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Suspense } from "react";

function StoreDisabledContent() {
  const searchParams = useSearchParams();
  const storeName = searchParams.get("store") || "This store";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
          Store Temporarily Disabled
        </h1>

        <p className="text-[#666] mb-2">
          <span className="font-semibold">{storeName}</span> has been temporarily disabled due to non-payment of the monthly subscription fee.
        </p>

        <p className="text-[#999] text-sm mb-20">
          If you are the store owner, please pay your pending bill from the dashboard to reactivate your store.
        </p>
        <p className="text-[#999] text-sm">
  <a
    href="https://hookit.online/"
    className="hover:underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    Create your own store at hookit.online.
  </a>
</p>
      </div>
    </div>
  );
}

export default function StoreDisabledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#1a1a1a] rounded-full animate-spin" />
      </div>
    }>
      <StoreDisabledContent />
    </Suspense>
  );
}