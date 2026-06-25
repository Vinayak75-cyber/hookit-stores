"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Event } from "@/types/events";

export function useEvents(eventStoreId?: string, options?: { published?: boolean }) {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        let query = supabase
          .from("events")
          .select(`
            *,
            event_posters (*),
            event_ticket_types (*)
          `);

        if (eventStoreId) {
          query = query.eq("event_store_id", eventStoreId);
        }

        if (options?.published) {
          query = query.eq("is_published", true);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [eventStoreId, options?.published]);

  return { events, loading, error };
}

export function useEvent(eventId?: string, eventSlug?: string) {
  const supabase = createClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId && !eventSlug) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from("events")
          .select(`
            *,
            event_posters (*),
            event_ticket_types (*),
            event_stores (id, name, slug)
          `);

        if (eventId) {
          query = query.eq("id", eventId);
        } else if (eventSlug) {
          query = query.eq("slug", eventSlug);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        
        // Fix nested relation arrays to objects
        const fixedData = {
          ...data,
          event_stores: Array.isArray(data.event_stores)
            ? data.event_stores[0]
            : data.event_stores,
        };
        
        setEvent(fixedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId, eventSlug]);

  return { event, loading, error };
}