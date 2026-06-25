"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Loader2,
  Save,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileText,
  Tag,
  AlertCircle,
} from "lucide-react";

interface EventFormProps {
  eventStoreId: string;
  eventStoreSlug: string;
  initialData?: any;
  eventId?: string;
}

export default function EventForm({
  eventStoreId,
  eventStoreSlug,
  initialData,
  eventId,
}: EventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!eventId;

  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    short_description: initialData?.short_description || "",
    description: initialData?.description || "",
    event_date: initialData?.event_date || "",
    start_time: initialData?.start_time || "",
    end_time: initialData?.end_time || "",
    venue_name: initialData?.venue_name || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    google_maps_url: initialData?.google_maps_url || "",
    contact_email: initialData?.contact_email || "",
    contact_phone: initialData?.contact_phone || "",
    refund_policy: initialData?.refund_policy || "",
    terms: initialData?.terms || "",
    instructions: initialData?.instructions || "",
    whatsapp_support: initialData?.whatsapp_support || "",
    age_restriction: initialData?.age_restriction || "",
    dress_code: initialData?.dress_code || "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({ ...prev, title: value }));
    if (!slugManuallyEdited) {
      setForm((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
    setForm((prev) => ({ ...prev, slug: cleanSlug }));
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and URL slug are required");
      setSaving(false);
      return;
    }

    try {
      const url = isEditing ? `/api/events/${eventId}` : "/api/events";
      const method = isEditing ? "PATCH" : "POST";

      const payload = isEditing
        ? { ...form }
        : { ...form, event_store_id: eventStoreId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save event");
        setSaving(false);
        return;
      }

      // Redirect to event detail page
      router.push(
        `/event-dashboard/${eventStoreSlug}/events/${data.data.id}`
      );
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#999999]" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Summer Music Festival 2026"
              required
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="summer-music-festival"
                required
                className={`${inputClass} font-mono pr-28`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999999]">
                /e/{eventStoreSlug}
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => handleChange("short_description", e.target.value)}
              placeholder="Brief tagline for your event"
              maxLength={150}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[#999999] text-right">
              {form.short_description.length}/150
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Full Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Tell attendees everything about your event..."
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#999999]" />
          Date & Time
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Event Date
            </label>
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => handleChange("event_date", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Start Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              End Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#999999]" />
          Venue & Location
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Venue Name
            </label>
            <input
              type="text"
              value={form.venue_name}
              onChange={(e) => handleChange("venue_name", e.target.value)}
              placeholder="e.g., Jio World Convention Centre"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              City
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="e.g., Mumbai"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Full Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Complete address with landmarks..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Google Maps URL
            </label>
            <input
              type="url"
              value={form.google_maps_url}
              onChange={(e) => handleChange("google_maps_url", e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#999999]" />
          Contact Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Contact Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                placeholder="events@example.com"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Contact Phone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => handleChange("contact_phone", e.target.value)}
                placeholder="+91 98765 43210"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              WhatsApp Support Number
            </label>
            <input
              type="tel"
              value={form.whatsapp_support}
              onChange={(e) => handleChange("whatsapp_support", e.target.value)}
              placeholder="For attendee queries"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#999999]" />
          Additional Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Age Restriction
            </label>
            <input
              type="text"
              value={form.age_restriction}
              onChange={(e) => handleChange("age_restriction", e.target.value)}
              placeholder="e.g., 18+ only"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Dress Code
            </label>
            <input
              type="text"
              value={form.dress_code}
              onChange={(e) => handleChange("dress_code", e.target.value)}
              placeholder="e.g., Smart Casual"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Refund Policy
            </label>
            <textarea
              value={form.refund_policy}
              onChange={(e) => handleChange("refund_policy", e.target.value)}
              placeholder="Describe your refund policy..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Terms & Conditions
            </label>
            <textarea
              value={form.terms}
              onChange={(e) => handleChange("terms", e.target.value)}
              placeholder="Event terms and conditions..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Special Instructions
            </label>
            <textarea
              value={form.instructions}
              onChange={(e) => handleChange("instructions", e.target.value)}
              placeholder="Any special instructions for attendees..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-medium bg-[#1a1a1a] text-white hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Save Changes" : "Create Event"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}