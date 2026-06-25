"use client";

import { IndianRupee, Wallet, AlertCircle, CheckCircle, Clock, Calendar } from "lucide-react";

interface PayoutSummaryProps {
  grossRevenue: number;
  platformCommission: number;
  payoutAmount: number;
  payoutStatus: "pending" | "scheduled" | "paid" | "on_hold";
  payoutDueDate?: string | null;
  paidAt?: string | null;
}

export default function PayoutSummary({
  grossRevenue,
  platformCommission,
  payoutAmount,
  payoutStatus,
  payoutDueDate,
  paidAt,
}: PayoutSummaryProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      label: "Pending",
    },
    scheduled: {
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      label: "Scheduled",
    },
    paid: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      label: "Paid",
    },
    on_hold: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      label: "On Hold",
    },
  };

  const status = statusConfig[payoutStatus];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Payout Summary</h3>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-[#666666]">Gross Revenue</span>
          <span className="text-sm font-medium text-[#1a1a1a]">
            ₹{grossRevenue.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-[#f5f5f5]">
          <span className="text-sm text-[#666666]">Platform Fee (5%)</span>
          <span className="text-sm font-medium text-red-500">
            -₹{platformCommission.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-[#e5e5e5]">
          <span className="text-sm font-semibold text-[#1a1a1a]">
            Your Payout
          </span>
          <span className="text-lg font-bold text-green-600">
            ₹{payoutAmount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {payoutDueDate && payoutStatus !== "paid" && (
        <div className="flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-xl">
          <Calendar className="w-4 h-4 text-[#666666]" />
          <span className="text-xs text-[#666666]">
            Scheduled for{" "}
            {new Date(payoutDueDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      )}

      {paidAt && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-700">
            Paid on{" "}
            {new Date(paidAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-[#f5f5f5] rounded-xl">
        <Wallet className="w-4 h-4 text-[#999999] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#888888]">
          Payouts are processed manually 1 week before the event date. You will
          be notified once your payout is scheduled.
        </p>
      </div>
    </div>
  );
}