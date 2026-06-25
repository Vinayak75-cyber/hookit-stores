"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

interface Payout {
  id: string;
  gross_revenue: number;
  platform_commission: number;
  payout_amount: number;
  payout_status: string;
  payout_due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function EventPayoutsPage() {
  const params = useParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventId = params.eventId as string;
  const supabase = createClient();

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayouts() {
      const { data } = await supabase
        .from("event_payouts")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      setPayouts(data || []);
      setLoading(false);
    }

    loadPayouts();
  }, [eventId]);

  const totalGross = payouts.reduce((s, p) => s + p.gross_revenue, 0);
  const totalCommission = payouts.reduce((s, p) => s + p.platform_commission, 0);
  const totalPayout = payouts.reduce((s, p) => s + p.payout_amount, 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "on_hold":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
            <AlertCircle className="w-3 h-3" /> On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f5f5] text-[#666666]">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/event-dashboard/${eventStoreSlug}/events/${eventId}`}
          className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Payouts</h1>
        <p className="text-sm text-[#888888] mt-1">
          Track revenue, commission, and payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">
            ₹{totalGross.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-[#888888] mt-1">Gross Revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">
            ₹{totalCommission.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-[#888888] mt-1">Platform Fee (5%)</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">
            ₹{totalPayout.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-[#888888] mt-1">Your Payout</p>
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-[#f5f5f5] rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#666666] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#1a1a1a]">
              Payout Policy
            </p>
            <p className="text-sm text-[#666666] mt-1">
              Platform keeps 5% commission from all ticket sales. Host payouts
              are processed manually 1 week before the event date. You will be
              notified when your payout is scheduled.
            </p>
          </div>
        </div>
      </div>

      {/* Payouts List */}
      {payouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 text-center">
          <Wallet className="w-10 h-10 text-[#cccccc] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">No payouts recorded yet</p>
          <p className="text-xs text-[#bbbbbb] mt-1">
            Payouts will appear here once tickets are sold
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Date
                </th>
                <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Gross
                </th>
                <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Fee (5%)
                </th>
                <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Payout
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1a1a1a]">
                      {new Date(payout.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-[#1a1a1a]">
                      ₹{payout.gross_revenue.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-[#666666]">
                      ₹{payout.platform_commission.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      ₹{payout.payout_amount.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(payout.payout_status)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#666666]">
                      {payout.payout_due_date
                        ? new Date(payout.payout_due_date).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </p>
                    {payout.paid_at && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Paid on{" "}
                        {new Date(payout.paid_at).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}