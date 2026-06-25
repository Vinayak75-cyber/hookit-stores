"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  Calendar,
  MapPin,
  Ticket,
  Loader2,
  ArrowRight,
  Store,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  event_date: string | null;
  venue_name: string | null;
  city: string | null;
  is_published: boolean;
  event_posters: { image_url: string; is_main: boolean }[];
  event_ticket_types: { price: number }[];
}

interface EventStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function EventStoreLandingPage() {
  const params = useParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const supabase = createClient();

  const [eventStore, setEventStore] = useState<EventStore | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Get event store
      const { data: store } = await supabase
        .from("event_stores")
        .select("id, name, slug, description")
        .eq("slug", eventStoreSlug)
        .single();

      if (!store) {
        setLoading(false);
        return;
      }

      setEventStore(store);

      // Get published events
      const { data: eventsData } = await supabase
        .from("events")
        .select(
          `
          id, title, slug, short_description, event_date, venue_name, city, is_published,
          event_posters (image_url, is_main),
          event_ticket_types (price)
        `
        )
        .eq("event_store_id", store.id)
        .eq("is_published", true)
        .order("event_date", { ascending: true });

      setEvents(eventsData || []);
      setLoading(false);
    }

    loadData();
  }, [eventStoreSlug]);

  const getMainPoster = (posters: any[]) => {
    const main = posters?.find((p) => p.is_main);
    return main?.image_url || posters?.[0]?.image_url;
  };

  const getMinPrice = (ticketTypes: any[]) => {
    if (!ticketTypes?.length) return null;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!eventStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Store not found
          </h1>
          <p className="text-sm text-[#666666]">
            This event store does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1a]">
                {eventStore.name}
              </h1>
              {eventStore.description && (
                <p className="text-xs text-[#888888]">{eventStore.description}</p>
              )}
            </div>
          </div>
          <div className="text-xs text-[#999999]">
            {eventStoreSlug}.hookit.online
          </div>
        </div>
      </header>

      {/* Events List */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-[#cccccc] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">
              No upcoming events
            </h2>
            <p className="text-sm text-[#888888]">
              Check back later for new events.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">
              Upcoming Events
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => {
                const poster = getMainPoster(event.event_posters);
                const minPrice = getMinPrice(event.event_ticket_types);

                return (
                  <Link
                    key={event.id}
                    href={`/e/${eventStoreSlug}/${event.slug}`}
                    className="group block bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden hover:border-[#1a1a1a] transition-all"
                  >
                    {/* Poster */}
                    <div className="aspect-[16/9] bg-[#f5f5f5] relative overflow-hidden">
                      {poster ? (
                        <img
                          src={poster}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-10 h-10 text-[#cccccc]" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#333333]">
                        {event.title}
                      </h3>

                      {event.short_description && (
                        <p className="text-sm text-[#666666] mb-3 line-clamp-2">
                          {event.short_description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[#888888] mb-4">
                        {event.event_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(event.event_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                        )}
                        {event.venue_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.city || event.venue_name}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-4 h-4 text-[#1a1a1a]" />
                          <span className="text-sm font-semibold text-[#1a1a1a]">
                            {minPrice !== null
                              ? `From ₹${minPrice.toLocaleString("en-IN")}`
                              : "Free"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[#1a1a1a] flex items-center gap-1 group-hover:gap-2 transition-all">
                          Book Now
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] px-6 py-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-[#999999]">
            Powered by{" "}
            <span className="font-medium text-[#1a1a1a]">hookit</span>
          </p>
        </div>
      </footer>
    </div>
  );
}