"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

interface BookNowButtonProps {
  href: string;
  price?: number | null;
  availableTickets?: number;
  disabled?: boolean;
}

export default function BookNowButton({
  href,
  price,
  availableTickets,
  disabled = false,
}: BookNowButtonProps) {
  const soldOut = availableTickets !== undefined && availableTickets <= 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-4 py-3 z-40">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div>
          {price !== null && price !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-[#1a1a1a]">
                ₹{price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-[#888888]">onwards</span>
            </div>
          )}
          {availableTickets !== undefined && (
            <p className="text-xs text-[#888888]">
              {soldOut
                ? "Sold out"
                : `${availableTickets} tickets available`}
            </p>
          )}
        </div>

        {disabled || soldOut ? (
          <button
            disabled
            className="flex-1 max-w-xs bg-[#e5e5e5] text-[#999999] font-semibold py-3.5 rounded-xl cursor-not-allowed text-sm"
          >
            {soldOut ? "Sold Out" : "Unavailable"}
          </button>
        ) : (
          <Link
            href={href}
            className="flex-1 max-w-xs bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors text-center text-sm flex items-center justify-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            Book Now
          </Link>
        )}
      </div>
    </div>
  );
}