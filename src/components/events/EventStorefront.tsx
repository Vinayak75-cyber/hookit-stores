"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Ticket,
} from "lucide-react";

interface Poster {
  image_url: string;
  is_main: boolean;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
}

interface EventStorefrontProps {
  eventStoreSlug: string;
  eventSlug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  google_maps_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  posters: Poster[];
  ticketTypes: TicketType[];
  storeName: string;
}

export default function EventStorefront({
  eventStoreSlug,
  eventSlug,
  title,
  short_description,
  description,
  event_date,
  start_time,
  end_time,
  venue_name,
  address,
  city,
  google_maps_url,
  contact_email,
  contact_phone,
  posters,
  ticketTypes,
  storeName,
}: EventStorefrontProps) {
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const sortedPosters = [...posters].sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
  const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map((t) => t.price)) : null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Poster Gallery */}
      <div className="relative bg-[#f5f5f5]">
        {sortedPosters.length > 0 ? (
          <>
            <div className="aspect-[4/5] max-h-[70vh] relative">
              <img
                src={sortedPosters[currentPosterIndex]?.image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            {sortedPosters.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentPosterIndex(
                      (prev) => (prev - 1 + sortedPosters.length) % sortedPosters.length
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-[#1a1a1a]" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPosterIndex((prev) => (prev + 1) % sortedPosters.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronRight className="w-5 h-5 text-[#1a1a1a]" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {sortedPosters.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPosterIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentPosterIndex ? "bg-white w-5" : "bg-white/50"
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
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">{title}</h1>
          {short_description && (
            <p className="text-sm text-[#666666]">{short_description}</p>
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

        {(event_date || start_time) && (
          <div className="bg-[#f5f5f5] rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Date & Time</h3>
            <div className="space-y-2">
              {event_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#666666]" />
                  <span className="text-sm text-[#1a1a1a]">
                    {new Date(event_date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {start_time && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#666666]" />
                  <span className="text-sm text-[#1a1a1a]">
                    {start_time}
                    {end_time ? ` - ${end_time}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {(venue_name || address || city) && (
          <div className="bg-[#f5f5f5] rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Location</h3>
            <div className="space-y-2">
              {venue_name && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#666666] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{venue_name}</p>
                    {address && <p className="text-sm text-[#666666]">{address}</p>}
                    {city && <p className="text-sm text-[#666666]">{city}</p>}
                  </div>
                </div>
              )}
              {google_maps_url && (
                <a
                  href={google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline ml-7"
                >
                  Get Directions
                </a>
              )}
            </div>
          </div>
        )}

        {description && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">About</h3>
            <p className="text-sm text-[#666666] whitespace-pre-wrap leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {(contact_email || contact_phone) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Contact</h3>
            <div className="space-y-2">
              {contact_email && (
                <a
                  href={`mailto:${contact_email}`}
                  className="text-sm text-blue-600 hover:underline block"
                >
                  {contact_email}
                </a>
              )}
              {contact_phone && (
                <a
                  href={`tel:${contact_phone}`}
                  className="text-sm text-blue-600 hover:underline block"
                >
                  {contact_phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Book Now Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-4 py-3 z-40">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/e/${eventStoreSlug}/${eventSlug}/book`}
            className="block w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors text-center text-sm"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}