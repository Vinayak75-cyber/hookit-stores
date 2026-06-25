"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Plus,
  Calendar,
  MapPin,
  Ticket,
  Loader2,
  Pencil,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import EmptyEventsState from "@/components/events/EmptyEventsState";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
  venue_name: string | null;
  city: string | null;
  is_published: boolean;
  event_posters: { image_url: string }[];
  event_ticket_types: { price: number }[];
}

export default function EventsListPage() {
  const params = useParams();
  const router = useRouter();
  const eventStoreSlug = params.eventStoreSlug as string;
  const supabase = createClient();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [eventStoreSlug]);

  async function loadEvents() {
    const { data: store } = await supabase
      .from("event_stores")
      .select("id")
      .eq("slug", eventStoreSlug)
      .single();

    if (!store) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("events")
      .select(
        `
        id, title, slug, event_date, venue_name, city, is_published,
        event_posters (image_url),
        event_ticket_types (price)
      `
      )
      .eq("event_store_id", store.id)
      .order("created_at", { ascending: false });

    setEvents(data || []);
    setLoading(false);
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeleting(eventId);
    await supabase.from("events").delete().eq("id", eventId);
    setDeleting(null);
    loadEvents();
  };

  const getMainPoster = (posters: any[]) => {
    return posters?.[0]?.image_url;
  };

  const getMinPrice = (ticketTypes: any[]) => {
    if (!ticketTypes?.length) return null;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Events</h1>
          <p className="text-sm text-[#888888] mt-1">
            Manage all your events
          </p>
        </div>
        <button
          onClick={() =>
            router.push(`/event-dashboard/${eventStoreSlug}/events/new`)
          }
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyEventsState eventStoreSlug={eventStoreSlug} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const poster = getMainPoster(event.event_posters);
            const minPrice = getMinPrice(event.event_ticket_types);

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden group"
              >
                {/* Poster */}
                <div className="aspect-[16/10] bg-[#f5f5f5] relative overflow-hidden">
                  {poster ? (
                    <img
                      src={poster}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-[#cccccc]" />
                    </div>
                  )}
                  <div
                    className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium ${
                      event.is_published
                        ? "bg-green-500 text-white"
                        : "bg-[#1a1a1a] text-white"
                    }`}
                  >
                    {event.is_published ? "Published" : "Draft"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2 truncate">
                    {event.title}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    {event.event_date && (
                      <div className="flex items-center gap-2 text-xs text-[#666666]">
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
                    {(event.venue_name || event.city) && (
                      <div className="flex items-center gap-2 text-xs text-[#666666]">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.city || event.venue_name}
                      </div>
                    )}
                    {minPrice !== null && (
                      <div className="flex items-center gap-2 text-xs text-[#666666]">
                        <Ticket className="w-3.5 h-3.5" />
                        From ₹{minPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/event-dashboard/${eventStoreSlug}/events/${event.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f5f5f5] text-xs font-medium text-[#1a1a1a] hover:bg-[#e5e5e5] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    {event.is_published && (
                      <Link
                        href={`/e/${eventStoreSlug}/${event.slug}`}
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f5f5f5] text-xs font-medium text-[#1a1a1a] hover:bg-[#e5e5e5] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleting === event.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}