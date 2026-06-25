"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Minus,
  Plus,
  Calendar,
  MapPin,
  Ticket,
  User,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  ChevronLeft,
  IndianRupee,
  Check,
} from "lucide-react";
import Link from "next/link";

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_booking: number;
  available: number;
}

interface EventData {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  venue_name: string | null;
  city: string | null;
  event_posters: { image_url: string }[];
  event_ticket_types: TicketType[];
}

export default function BookTicketPage() {
  const params = useParams();
  const router = useRouter();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventSlug = params.eventSlug as string;
  const supabase = createClient();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, number>
  >({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select(
          `
          id, title, event_date, start_time, venue_name, city,
          event_posters (image_url),
          event_ticket_types (id, name, price, quantity_total, quantity_sold, max_per_booking)
        `
        )
        .eq("slug", eventSlug)
        .eq("is_published", true)
        .single();

      if (data) {
        const ticketTypes = (data.event_ticket_types || []).map((t: any) => ({
          ...t,
          available: t.quantity_total - t.quantity_sold,
        }));
        setEvent({ ...data, event_ticket_types: ticketTypes });
      }
      setLoading(false);
    }

    loadEvent();
  }, [eventSlug]);

  const handleQuantityChange = (ticketId: string, delta: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const ticket = event?.event_ticket_types.find((t) => t.id === ticketId);
      if (!ticket) return prev;

      const newQty = Math.max(0, Math.min(current + delta, ticket.available, ticket.max_per_booking));
      if (newQty === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketId]: newQty };
    });
  };

  const totalTickets = Object.values(selectedTickets).reduce((a, b) => a + b, 0);
  const subtotal =
    event?.event_ticket_types.reduce((sum, ticket) => {
      const qty = selectedTickets[ticket.id] || 0;
      return sum + ticket.price * qty;
    }, 0) || 0;

  const handleBook = async () => {
    setError("");
    if (totalTickets === 0) {
      setError("Please select at least one ticket");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setBooking(true);

    try {
      // 1. Create booking
      const bookingItems = event!.event_ticket_types
        .filter((t) => selectedTickets[t.id] > 0)
        .map((t) => ({
          ticket_type_id: t.id,
          ticket_name: t.name,
          quantity: selectedTickets[t.id],
          unit_price: t.price,
          total_price: t.price * selectedTickets[t.id],
        }));

      const totalAmount = bookingItems.reduce((s, i) => s + i.total_price, 0);
      const platformFee = Math.round(totalAmount * 0.05 * 100) / 100; // 5% commission
      const hostPayout = totalAmount - platformFee;

      const bookingRes = await fetch("/api/event-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event!.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || null,
          customer_phone: customerPhone.trim(),
          total_amount: totalAmount,
          platform_fee: platformFee,
          host_payout_amount: hostPayout,
          items: bookingItems,
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) {
        setError(bookingData.error || "Failed to create booking");
        setBooking(false);
        return;
      }

      const bookingId = bookingData.data.booking.id;

      // 2. Create Razorpay order
      const orderRes = await fetch("/api/event-payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          amount: totalAmount,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Failed to create payment");
        setBooking(false);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hookit Events",
        description: `Tickets for ${event!.title}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // 4. Verify payment
          const verifyRes = await fetch("/api/event-payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            router.push(
              `/e/${eventStoreSlug}/${eventSlug}/success?booking=${bookingId}`
            );
          } else {
            setError("Payment verification failed. Please contact support.");
            setBooking(false);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#1a1a1a",
        },
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function () {
        setError("Payment failed. Please try again.");
        setBooking(false);
      });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#cccccc] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Event not found
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

  const poster = event.event_posters?.[0]?.image_url;

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] px-4 py-3 sticky top-0 bg-white z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href={`/e/${eventStoreSlug}/${eventSlug}`}
            className="p-2 -ml-2 rounded-xl hover:bg-[#f5f5f5] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#1a1a1a]" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-[#1a1a1a]">Book Tickets</h1>
            <p className="text-xs text-[#888888] truncate">{event.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Event Summary */}
        <div className="flex gap-4 p-4 bg-[#f5f5f5] rounded-2xl">
          {poster && (
            <img
              src={poster}
              alt={event.title}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#1a1a1a] truncate">
              {event.title}
            </h2>
            <div className="mt-2 space-y-1">
              {event.event_date && (
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.event_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              )}
              {event.venue_name && (
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <MapPin className="w-3 h-3" />
                  {event.city || event.venue_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">
            Select Tickets
          </h3>
          {event.event_ticket_types
            .filter((t) => t.available > 0)
            .map((ticket) => {
              const qty = selectedTickets[ticket.id] || 0;
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border border-[#e5e5e5] rounded-2xl"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      {ticket.name}
                    </p>
                    <p className="text-xs text-[#888888] mt-0.5">
                      {ticket.available} left · Max {ticket.max_per_booking}
                    </p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                      ₹{ticket.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(ticket.id, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-[#1a1a1a]" />
                    </button>
                    <span className="text-sm font-semibold text-[#1a1a1a] w-4 text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(ticket.id, 1)}
                      disabled={
                        qty >= ticket.available || qty >= ticket.max_per_booking
                      }
                      className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#1a1a1a]" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Customer Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">
            Your Details
          </h3>

          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Fixed Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-4 py-4 z-40">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#666666]" />
              <span className="text-sm text-[#666666]">
                {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-[#1a1a1a]" />
              <span className="text-lg font-bold text-[#1a1a1a]">
                {subtotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <button
            onClick={handleBook}
            disabled={booking || totalTickets === 0}
            className="w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {booking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Pay & Book Ticket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}