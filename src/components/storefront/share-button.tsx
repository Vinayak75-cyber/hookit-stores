"use client";

import { Share2 } from "lucide-react";

interface ShareButtonProps {
  productName: string;
  storeName: string;
}

export function ShareButton({ productName, storeName }: ShareButtonProps) {
  return (
    <button
      onClick={async () => {
        const url = window.location.href;
        const shareData = {
          title: productName,
          text: `Check out ${productName} on ${storeName}`,
          url,
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if ((err as Error).name !== "AbortError") console.error("Share failed:", err);
          }
        } else {
          try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
          } catch {
            alert("Unable to share. Copy the URL from your browser address bar.");
          }
        }
      }}
      className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors"
    >
      <Share2 className="w-5 h-5 text-[#666666]" />
    </button>
  );
}