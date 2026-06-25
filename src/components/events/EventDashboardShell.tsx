"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import EventSidebar from "./EventSidebar";
import { Loader2 } from "lucide-react";

interface EventStore {
  id: string;
  name: string;
  slug: string;
}

export default function EventDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const supabase = createClient();

  const [eventStore, setEventStore] = useState<EventStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventStore() {
      const { data } = await supabase
        .from("event_stores")
        .select("id, name, slug")
        .eq("slug", eventStoreSlug)
        .single();

      if (data) {
        setEventStore(data);
      }
      setLoading(false);
    }

    if (eventStoreSlug) {
      fetchEventStore();
    }
  }, [eventStoreSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!eventStore) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Event store not found
          </h1>
          <p className="text-[#666666] text-sm">
            This event store does not exist or you do not have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <EventSidebar
        eventStoreSlug={eventStore.slug}
        eventStoreName={eventStore.name}
      />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}