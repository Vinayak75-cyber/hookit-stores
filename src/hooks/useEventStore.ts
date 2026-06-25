"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { EventStore } from "@/types/events";

export function useEventStore(slug: string) {
  const supabase = createClient();
  const [eventStore, setEventStore] = useState<EventStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStore() {
      try {
        const { data, error } = await supabase
          .from("event_stores")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;
        setEventStore(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchStore();
    }
  }, [slug]);

  return { eventStore, loading, error };
}