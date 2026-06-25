"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { EventBooking } from "@/types/events";

export function useEventBookings(eventId?: string) {
  const supabase = createClient();
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        let query = supabase
          .from("event_bookings")
          .select(`
            *,
            event_booking_items (*),
            events (title, slug)
          `)
          .order("created_at", { ascending: false });

        if (eventId) {
          query = query.eq("event_id", eventId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setBookings(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [eventId]);

  return { bookings, loading, error };
}