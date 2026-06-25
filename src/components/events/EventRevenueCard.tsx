"use client";

import { IndianRupee, TrendingUp, Ticket, Users } from "lucide-react";

interface EventRevenueCardProps {
  totalRevenue: number;
  totalTickets: number;
  totalAttendees: number;
  platformFee: number;
  hostPayout: number;
}

export default function EventRevenueCard({
  totalRevenue,
  totalTickets,
  totalAttendees,
  platformFee,
  hostPayout,
}: EventRevenueCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-5">
      <h3 className="text-sm font-semibold text-[#1a1a1a]">Revenue Breakdown</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[#f5f5f5] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-[#888888]">Gross Revenue</span>
          </div>
          <p className="text-xl font-bold text-[#1a1a1a]">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="p-4 bg-[#f5f5f5] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-[#888888]">Tickets Sold</span>
          </div>
          <p className="text-xl font-bold text-[#1a1a1a]">{totalTickets}</p>
        </div>

        <div className="p-4 bg-[#f5f5f5] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-[#888888]">Attendees</span>
          </div>
          <p className="text-xl font-bold text-[#1a1a1a]">{totalAttendees}</p>
        </div>

        <div className="p-4 bg-[#f5f5f5] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-[#888888]">Platform Fee (5%)</span>
          </div>
          <p className="text-xl font-bold text-[#1a1a1a]">
            ₹{platformFee.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="border-t border-[#e5e5e5] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#1a1a1a]">
            Your Payout
          </span>
          <span className="text-xl font-bold text-green-600">
            ₹{hostPayout.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-xs text-[#888888] mt-1">
          Paid 1 week before event date
        </p>
      </div>
    </div>
  );
}