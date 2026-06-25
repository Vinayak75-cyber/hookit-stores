"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Check,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  User,
  Download,
  Share2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface TicketData {
  id: string;
  ticket_code: string;
  ticket_type_name: string;
  status: string;
}

interface BookingData {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  created_at: string;
  event_tickets: TicketData[];
  events: {
    title: string;
    event_date: string | null;
    start_time: string | null;
    venue_name: string | null;
    city: string | null;
  };
}

export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventSlug = params.eventSlug as string;
  const bookingId = searchParams.get("booking");
  const supabase = createClient();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("event_bookings")
        .select(
          `
          id, customer_name, customer_email, customer_phone, total_amount, created_at,
          event_tickets (id, ticket_code, ticket_type_name, status),
          events (title, event_date, start_time, venue_name, city)
        `
        )
        .eq("id", bookingId)
        .single();

      if (data) {
        setBooking(data as any);
      }
      setLoading(false);
    }

    loadBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!booking || !bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#cccccc] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Booking not found
          </h1>
          <Link
            href={`/e/${eventStoreSlug}`}
            className="text-sm text-[#1a1a1a] hover:underline"
          >
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const event = booking.events;
  const tickets = booking.event_tickets || [];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-[#666666]">
            Your tickets have been booked successfully.
          </p>
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5 mb-4">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">
            {event?.title}
          </h2>
          <div className="space-y-2">
            {event?.event_date && (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Calendar className="w-4 h-4" />
                {new Date(event.event_date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
            {event?.start_time && (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Clock className="w-4 h-4" />
                {event.start_time}
              </div>
            )}
            {(event?.venue_name || event?.city) && (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <MapPin className="w-4 h-4" />
                {event.venue_name}
                {event.city && `, ${event.city}`}
              </div>
            )}
          </div>
        </div>

        {/* Attendee Info */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5 mb-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
            Attendee Details
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#666666]">
              <User className="w-4 h-4" />
              {booking.customer_name}
            </div>
            {booking.customer_email && (
              <div className="text-sm text-[#666666] ml-6">
                {booking.customer_email}
              </div>
            )}
            {booking.customer_phone && (
              <div className="text-sm text-[#666666] ml-6">
                {booking.customer_phone}
              </div>
            )}
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5 mb-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Your Tickets ({tickets.length})
          </h3>
          <div className="space-y-3">
            {tickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="border border-[#e5e5e5] rounded-xl p-4 bg-[#fafafa]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#888888]">
                    Ticket {index + 1}
                  </span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                  {ticket.ticket_type_name}
                </p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-bold text-[#1a1a1a] tracking-wider">
                    {ticket.ticket_code}
                  </code>
                  {/* QR Code placeholder */}
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5 mb-6">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
            Payment Summary
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#666666]">Total Paid</span>
            <span className="text-lg font-bold text-[#1a1a1a]">
              ₹{booking.total_amount.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-[#999999] mt-2">
            Booked on {new Date(booking.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#e5e5e5] text-sm font-medium text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Tickets for ${event?.title}`,
                  text: `I've booked tickets for ${event?.title}!`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href={`/e/${eventStoreSlug}`}
            className="text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
          >
            Browse more events
          </Link>
        </div>
      </div>
    </div>
  );
}