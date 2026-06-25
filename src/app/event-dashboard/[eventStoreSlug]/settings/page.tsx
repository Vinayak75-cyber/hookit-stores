"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Store,
  Globe,
  FileText,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";

export default function EventStoreSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventStoreSlug = params.eventStoreSlug as string;
  const supabase = createClient();

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from("event_stores")
        .select("*")
        .eq("slug", eventStoreSlug)
        .single();

      if (data) {
        setStore(data);
        setForm({
          name: data.name,
          description: data.description || "",
          is_active: data.is_active,
        });
      }
      setLoading(false);
    }

    loadStore();
  }, [eventStoreSlug]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.name.trim()) {
      setError("Store name is required");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("event_stores")
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
      })
      .eq("id", store.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[#666666]">Store not found</p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/event-dashboard/${eventStoreSlug}`}
          className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Store Settings</h1>
        <p className="text-sm text-[#888888] mt-1">
          Manage your event store details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Store Name */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#999999]" />
            Store Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Store URL */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#999999]" />
            Store URL
          </h3>
          <div className="flex items-center gap-3 p-4 bg-[#f5f5f5] rounded-xl">
            <span className="text-sm text-[#666666]">hookit.online/e/</span>
            <code className="text-sm font-mono font-medium text-[#1a1a1a]">
              {eventStoreSlug}
            </code>
          </div>
          <p className="text-xs text-[#888888]">
            Your store URL cannot be changed.
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">
                Store Status
              </h3>
              <p className="text-xs text-[#888888]">
                {form.is_active
                  ? "Your store is visible to the public"
                  : "Your store is hidden from the public"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("is_active", !form.is_active)}
              className="transition-colors"
            >
              {form.is_active ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-[#cccccc]" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push(`/event-dashboard/${eventStoreSlug}`)}
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}