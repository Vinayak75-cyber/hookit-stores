"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import EventForm from "@/components/events/EventForm";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditEventPage() {
  const params = useParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventId = params.eventId as string;
  const supabase = createClient();

  const [eventStore, setEventStore] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Get event store
      const { data: store } = await supabase
        .from("event_stores")
        .select("id, name, slug")
        .eq("slug", eventStoreSlug)
        .single();

      // Get event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      setEventStore(store);
      setEvent(eventData);
      setLoading(false);
    }

    fetchData();
  }, [eventStoreSlug, eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!eventStore || !event) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[#666666]">Event not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/event-dashboard/${eventStoreSlug}/events/${eventId}`}
          className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Edit event</h1>
        <p className="text-sm text-[#888888] mt-1">
          Update your event details below.
        </p>
      </div>

      <EventForm
        eventStoreId={eventStore.id}
        eventStoreSlug={eventStoreSlug}
        initialData={event}
        eventId={eventId}
      />
    </div>
  );
}