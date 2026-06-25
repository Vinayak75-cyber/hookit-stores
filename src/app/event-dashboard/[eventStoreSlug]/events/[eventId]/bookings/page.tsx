"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Search,
  IndianRupee,
  Ticket,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
  event_booking_items: {
    ticket_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export default function EventBookingsPage() {
  const params = useParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventId = params.eventId as string;
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadBookings() {
      const { data } = await supabase
        .from("event_bookings")
        .select(
          `
          id, customer_name, customer_email, customer_phone, total_amount,
          payment_status, booking_status, created_at,
          event_booking_items (ticket_name, quantity, unit_price)
        `
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      setBookings(data || []);
      setLoading(false);
    }

    loadBookings();
  }, [eventId]);

  const filteredBookings = bookings.filter(
    (b) =>
      b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_phone?.includes(search)
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
            <XCircle className="w-3 h-3" /> Failed
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

  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + b.total_amount, 0);

  const totalTickets = bookings.reduce(
    (sum, b) =>
      sum + b.event_booking_items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Bookings</h1>
        <p className="text-sm text-[#888888] mt-1">
          Manage ticket bookings and payments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-[#888888] mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">{totalTickets}</p>
          <p className="text-sm text-[#888888] mt-1">Tickets Sold</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">
            {bookings.filter((b) => b.payment_status === "paid").length}
          </p>
          <p className="text-sm text-[#888888] mt-1">Confirmed Bookings</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
        />
      </div>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 text-center">
          <Ticket className="w-10 h-10 text-[#cccccc] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">No bookings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Tickets
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Amount
                </th>
                <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      {booking.customer_name}
                    </p>
                    {booking.customer_email && (
                      <p className="text-xs text-[#888888]">
                        {booking.customer_email}
                      </p>
                    )}
                    {booking.customer_phone && (
                      <p className="text-xs text-[#888888]">
                        {booking.customer_phone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {booking.event_booking_items.map((item, i) => (
                        <p key={i} className="text-sm text-[#666666]">
                          {item.quantity}x {item.ticket_name}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">{statusBadge(booking.payment_status)}</td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      ₹{booking.total_amount.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-[#666666]">
                      {new Date(booking.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
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