"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  Pencil,
  Loader2,
  Check,
  X,
  ImageIcon,
  Ticket,
  Users,
  IndianRupee,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import PublishChecklist from "@/components/events/PublishChecklist";
import EventPosterUploader from "@/components/events/EventPosterUploader";
import TicketManager from "@/components/events/TicketManager";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventId = params.eventId as string;
  const supabase = createClient();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "posters" | "tickets">("details");

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (data.data) {
        setEvent(data.data);
      }
    } catch (err) {
      console.error("Failed to load event:", err);
    }
    setLoading(false);
  }

  const handlePublishToggle = async (publish: boolean) => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: publish }),
      });
      const data = await res.json();
      if (data.data) {
        setEvent((prev: any) => ({ ...prev, is_published: data.data.is_published }));
      }
    } catch (err) {
      console.error("Failed to publish:", err);
    }
    setPublishing(false);
  };

  const checklistItems = event
    ? [
        { label: "Event title added", completed: !!event.title },
        { label: "Poster uploaded", completed: !!(event.event_posters?.length > 0) },
        { label: "Date & time added", completed: !!(event.event_date && event.start_time) },
        { label: "Venue added", completed: !!event.venue_name },
        { label: "At least one ticket type added", completed: !!(event.event_ticket_types?.length > 0) },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[#666666]">Event not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/event-dashboard/${eventStoreSlug}`}
            className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/event-dashboard/${eventStoreSlug}/events/${eventId}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e5e5e5] text-sm font-medium text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          {event.is_published && (
            <Link
              href={`/e/${eventStoreSlug}/${event.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </Link>
          )}
        </div>
      </div>

      {/* Event Title & Status */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{event.title}</h1>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              event.is_published
                ? "bg-green-50 text-green-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {event.is_published ? (
              <>
                <Check className="w-3 h-3 mr-1" /> Published
              </>
            ) : (
              <>
                <X className="w-3 h-3 mr-1" /> Draft
              </>
            )}
          </span>
        </div>
        {event.short_description && (
          <p className="text-[#666666] text-sm">{event.short_description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-1">
            <div className="flex gap-1">
              {[
                { id: "details" as const, label: "Details", icon: Calendar },
                { id: "posters" as const, label: "Posters", icon: ImageIcon },
                { id: "tickets" as const, label: "Tickets", icon: Ticket },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#666666] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "details" && (
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-6">
              {/* Date & Time */}
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Date & Time
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-[#f5f5f5] rounded-xl">
                    <Calendar className="w-5 h-5 text-[#666666]" />
                    <div>
                      <p className="text-xs text-[#888888]">Date</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {event.event_date
                          ? new Date(event.event_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[#f5f5f5] rounded-xl">
                    <Clock className="w-5 h-5 text-[#666666]" />
                    <div>
                      <p className="text-xs text-[#888888]">Start</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {event.start_time || "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[#f5f5f5] rounded-xl">
                    <Clock className="w-5 h-5 text-[#666666]" />
                    <div>
                      <p className="text-xs text-[#888888]">End</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {event.end_time || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Venue
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#666666] mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {event.venue_name || "Not set"}
                      </p>
                      {event.address && (
                        <p className="text-sm text-[#666666] mt-0.5">
                          {event.address}
                        </p>
                      )}
                      {event.city && (
                        <p className="text-sm text-[#666666]">{event.city}</p>
                      )}
                    </div>
                  </div>
                  {event.google_maps_url && (
                    <a
                      href={event.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Open in Google Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.contact_email && (
                    <div className="flex items-center gap-3 p-4 bg-[#f5f5f5] rounded-xl">
                      <Mail className="w-5 h-5 text-[#666666]" />
                      <div>
                        <p className="text-xs text-[#888888]">Email</p>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                          {event.contact_email}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.contact_phone && (
                    <div className="flex items-center gap-3 p-4 bg-[#f5f5f5] rounded-xl">
                      <Phone className="w-5 h-5 text-[#666666]" />
                      <div>
                        <p className="text-xs text-[#888888]">Phone</p>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                          {event.contact_phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                    About
                  </h3>
                  <p className="text-sm text-[#666666] whitespace-pre-wrap">
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
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                    Additional Information
                  </h3>
                  <div className="space-y-3">
                    {event.age_restriction && (
                      <p className="text-sm text-[#666666]">
                        <span className="font-medium text-[#1a1a1a]">
                          Age Restriction:
                        </span>{" "}
                        {event.age_restriction}
                      </p>
                    )}
                    {event.dress_code && (
                      <p className="text-sm text-[#666666]">
                        <span className="font-medium text-[#1a1a1a]">
                          Dress Code:
                        </span>{" "}
                        {event.dress_code}
                      </p>
                    )}
                    {event.refund_policy && (
                      <p className="text-sm text-[#666666]">
                        <span className="font-medium text-[#1a1a1a]">
                          Refund Policy:
                        </span>{" "}
                        {event.refund_policy}
                      </p>
                    )}
                    {event.terms && (
                      <p className="text-sm text-[#666666]">
                        <span className="font-medium text-[#1a1a1a]">
                          Terms:
                        </span>{" "}
                        {event.terms}
                      </p>
                    )}
                    {event.instructions && (
                      <p className="text-sm text-[#666666]">
                        <span className="font-medium text-[#1a1a1a]">
                          Instructions:
                        </span>{" "}
                        {event.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "posters" && (
            <EventPosterUploader
              eventId={eventId}
              posters={event.event_posters || []}
              onUpdate={loadEvent}
            />
          )}

          {activeTab === "tickets" && (
            <TicketManager
              eventId={eventId}
              ticketTypes={event.event_ticket_types || []}
              onUpdate={loadEvent}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Checklist */}
          <PublishChecklist
            items={checklistItems}
            isPublished={event.is_published}
            onPublish={() => handlePublishToggle(true)}
            onUnpublish={() => handlePublishToggle(false)}
            publishing={publishing}
          />

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Event Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <Ticket className="w-4 h-4" />
                  Tickets sold
                </div>
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  {event.event_ticket_types?.reduce(
                    (sum: number, t: any) => sum + (t.quantity_sold || 0),
                    0
                  ) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <Users className="w-4 h-4" />
                  Attendees
                </div>
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  {event.event_ticket_types?.reduce(
                    (sum: number, t: any) => sum + (t.quantity_sold || 0),
                    0
                  ) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <IndianRupee className="w-4 h-4" />
                  Revenue
                </div>
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  ₹0
                </span>
              </div>
            </div>
          </div>

          {/* Share Link */}
          {event.is_published && (
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
                Share Event
              </h3>
              <div className="flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-xl">
                <code className="text-xs text-[#666666] flex-1 truncate">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/e/${eventStoreSlug}/${event.slug}`
                    : `/e/${eventStoreSlug}/${event.slug}`}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/e/${eventStoreSlug}/${event.slug}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="text-xs font-medium text-[#1a1a1a] hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}