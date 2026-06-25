"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Globe,
  FileText,
  Check,
  Loader2,
} from "lucide-react";

export default function CreateEventStorePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      const newSlug = generateSlug(value);
      setSlug(newSlug);
      if (newSlug) checkSlugAvailability(newSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
    setSlug(cleanSlug);
    if (cleanSlug) checkSlugAvailability(cleanSlug);
  };

  let slugTimeout: ReturnType<typeof setTimeout>;
  const checkSlugAvailability = async (slugToCheck: string) => {
    clearTimeout(slugTimeout);
    setCheckingSlug(true);
    setSlugAvailable(null);

    slugTimeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/event-stores/check-slug?slug=${encodeURIComponent(slugToCheck)}`
        );
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim() || !slug.trim()) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (slugAvailable === false) {
      setError("This store URL is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/event-stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create event store");
        setLoading(false);
        return;
      }

      // Redirect to event dashboard
      router.push(`/event-dashboard/${data.data.slug}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666666] hover:text-[#1a1a1a] transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Badge */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-3 py-1 rounded-full text-xs font-medium mb-4">
            <Calendar className="w-3 h-3" />
            Events Store
          </span>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">
            Create your events store
          </h1>
          <p className="text-[#888888]">
            Set up your event ticketing platform in just a few steps.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Store name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Mumbai Events Hub"
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm"
              />
            </div>
          </div>

          {/* Store URL */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Store URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-events-store"
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-28 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999999]">
                .hookit.online
              </span>
            </div>
            {/* Slug availability indicator */}
            <div className="mt-2 flex items-center gap-2">
              {checkingSlug && (
                <span className="text-xs text-[#999999] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking availability...
                </span>
              )}
              {!checkingSlug && slugAvailable === true && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Available
                </span>
              )}
              {!checkingSlug && slugAvailable === false && (
                <span className="text-xs text-red-500">
                  This URL is already taken
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[#999999]" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about the events you plan to host..."
                rows={4}
                maxLength={500}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm resize-none"
              />
            </div>
            <p className="mt-1 text-xs text-[#999999] text-right">
              {description.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || slugAvailable === false}
            className="w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating your events store...
              </>
            ) : (
              "Create events store"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}