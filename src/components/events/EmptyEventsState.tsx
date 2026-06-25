"use client";

import { Calendar, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyEventsStateProps {
  eventStoreSlug: string;
}

export default function EmptyEventsState({
  eventStoreSlug,
}: EmptyEventsStateProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 text-center">
      <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-[#cccccc]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
        No events yet
      </h3>
      <p className="text-sm text-[#888888] mb-6 max-w-sm mx-auto">
        Create your first event and start selling tickets to your audience.
      </p>
      <button
        onClick={() =>
          router.push(`/event-dashboard/${eventStoreSlug}/events/new`)
        }
        className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create first event
      </button>
    </div>
  );
}