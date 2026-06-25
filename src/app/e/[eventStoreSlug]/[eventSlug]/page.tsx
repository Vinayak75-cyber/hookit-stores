"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Store,
  Share2,
} from "lucide-react";
import Link from "next/link";

interface EventData {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  google_maps_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  refund_policy: string | null;
  terms: string | null;
  instructions: string | null;
  age_restriction: string | null;
  dress_code: string | null;
  event_posters: { image_url: string; is_main: boolean }[];
  event_ticket_types: {
    id: string;
    name: string;
    price: number;
    quantity_total: number;
    quantity_sold: number;
    is_active: boolean;
  }[];
  event_stores: { name: string; slug: string };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventSlug = params.eventSlug as string;
  const supabase = createClient();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select(
          `
          id, title, short_description, description, event_date, start_time, end_time,
          venue_name, address, city, google_maps_url, contact_email, contact_phone,
          refund_policy, terms, instructions, age_restriction, dress_code,
          event_posters (image_url, is_main),
          event_ticket_types (id, name, price, quantity_total, quantity_sold, is_active),
          event_stores (name, slug)
        `
        )
        .eq("slug", eventSlug)
        .eq("is_published", true)
        .single();

      if (data) {
  // Supabase returns joined relations as arrays, convert to single object
  const fixedData = {
    ...data,
    event_stores: Array.isArray(data.event_stores)
      ? data.event_stores[0]
      : data.event_stores,
  };
  setEvent(fixedData);
}
      setLoading(false);
    }

    loadEvent();
  }, [eventSlug]);

  const posters = event?.event_posters || [];
  const activeTickets =
    event?.event_ticket_types?.filter((t) => t.is_active) || [];
  const minPrice =
    activeTickets.length > 0
      ? Math.min(...activeTickets.map((t) => t.price))
      : null;
  const totalAvailable = activeTickets.reduce(
    (sum, t) => sum + (t.quantity_total - t.quantity_sold),
    0
  );

  const nextPoster = () => {
    setCurrentPosterIndex((prev) => (prev + 1) % posters.length);
  };

  const prevPoster = () => {
    setCurrentPosterIndex(
      (prev) => (prev - 1 + posters.length) % posters.length
    );
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
          <p className="text-sm text-[#666666] mb-6">
            This event may have been removed or is not yet published.
          </p>
          <Link
            href={`/e/${eventStoreSlug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1a1a1a] hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/e/${eventStoreSlug}`}
            className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a]"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#999999]" />
            <span className="text-sm font-medium text-[#1a1a1a]">
              {event.event_stores?.name}
            </span>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors"
          >
            <Share2 className="w-4 h-4 text-[#666666]" />
          </button>
        </div>
      </header>

      {/* Poster Gallery */}
      <div className="relative bg-[#f5f5f5]">
        {posters.length > 0 ? (
          <>
            <div className="aspect-[4/5] max-h-[70vh] relative">
              <img
                src={posters[currentPosterIndex]?.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            {posters.length > 1 && (
              <>
                <button
                  onClick={prevPoster}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-[#1a1a1a]" />
                </button>
                <button
                  onClick={nextPoster}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronRight className="w-5 h-5 text-[#1a1a1a]" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {posters.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPosterIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentPosterIndex
                          ? "bg-white w-5"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="aspect-[4/5] max-h-[50vh] flex items-center justify-center">
            <Calendar className="w-16 h-16 text-[#cccccc]" />
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Title & Price */}
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            {event.title}
          </h1>
          {event.short_description && (
            <p className="text-sm text-[#666666]">{event.short_description}</p>
          )}
          {minPrice !== null && (
            <div className="flex items-center gap-2 mt-3">
              <Ticket className="w-5 h-5 text-[#1a1a1a]" />
              <span className="text-xl font-bold text-[#1a1a1a]">
                ₹{minPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-[#888888]">onwards</span>
            </div>
          )}
        </div>

        {/* Date & Time */}
        {(event.event_date || event.start_time) && (
          <div className="bg-[#f5f5f5] rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Date & Time
            </h3>
            <div className="space-y-2">
              {event.event_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#666666]" />
                  <span className="text-sm text-[#1a1a1a]">
                    {new Date(event.event_date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {(event.start_time || event.end_time) && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#666666]" />
                  <span className="text-sm text-[#1a1a1a]">
                    {event.start_time || "TBA"}
                    {event.end_time ? ` - ${event.end_time}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Venue */}
        {(event.venue_name || event.address || event.city) && (
          <div className="bg-[#f5f5f5] rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Location</h3>
            <div className="space-y-2">
              {event.venue_name && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#666666] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      {event.venue_name}
                    </p>
                    {event.address && (
                      <p className="text-sm text-[#666666]">{event.address}</p>
                    )}
                    {event.city && (
                      <p className="text-sm text-[#666666]">{event.city}</p>
                    )}
                  </div>
                </div>
              )}
              {event.google_maps_url && (
                <a
                  href={event.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline ml-7"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Get Directions
                </a>
              )}
            </div>
          </div>
        )}

        {/* Ticket Types */}
        {activeTickets.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Available Tickets
            </h3>
            <div className="space-y-2">
              {activeTickets.map((ticket) => {
                const available = ticket.quantity_total - ticket.quantity_sold;
                const soldOut = available <= 0;

                return (
                  <div
                    key={ticket.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      soldOut
                        ? "border-[#e5e5e5] bg-[#fafafa] opacity-60"
                        : "border-[#e5e5e5] bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {ticket.name}
                      </p>
                      <p className="text-xs text-[#888888] mt-0.5">
                        {soldOut
                          ? "Sold out"
                          : `${available} tickets left`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        ₹{ticket.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* About */}
        {event.description && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">About</h3>
            <p className="text-sm text-[#666666] whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Additional Info */}
        {(event.age_restriction ||
          event.dress_code ||
          event.refund_policy ||
          event.terms ||
          event.instructions) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Good to Know
            </h3>
            <div className="space-y-2 text-sm text-[#666666]">
              {event.age_restriction && (
                <p>
                  <span className="font-medium text-[#1a1a1a]">
                    Age Restriction:
                  </span>{" "}
                  {event.age_restriction}
                </p>
              )}
              {event.dress_code && (
                <p>
                  <span className="font-medium text-[#1a1a1a]">
                    Dress Code:
                  </span>{" "}
                  {event.dress_code}
                </p>
              )}
              {event.refund_policy && (
                <p>
                  <span className="font-medium text-[#1a1a1a]">
                    Refund Policy:
                  </span>{" "}
                  {event.refund_policy}
                </p>
              )}
              {event.instructions && (
                <p>
                  <span className="font-medium text-[#1a1a1a]">
                    Instructions:
                  </span>{" "}
                  {event.instructions}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {(event.contact_email || event.contact_phone) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Contact</h3>
            <div className="space-y-2">
              {event.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#666666]" />
                  <a
                    href={`mailto:${event.contact_email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {event.contact_email}
                  </a>
                </div>
              )}
              {event.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#666666]" />
                  <a
                    href={`tel:${event.contact_phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {event.contact_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Book Now Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-4 py-3 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            {minPrice !== null && (
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-[#1a1a1a]">
                  ₹{minPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-[#888888]">onwards</span>
              </div>
            )}
            <p className="text-xs text-[#888888]">
              {totalAvailable > 0
                ? `${totalAvailable} tickets available`
                : "Sold out"}
            </p>
          </div>
          <button
            onClick={() =>
              router.push(`/e/${eventStoreSlug}/${eventSlug}/book`)
            }
            disabled={totalAvailable <= 0}
            className="flex-1 max-w-xs bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {totalAvailable > 0 ? "Book Now" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}