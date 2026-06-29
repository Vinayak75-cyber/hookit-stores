"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { fetchWithCsrf } from "@/hooks/use-csrf";
import {
  ArrowLeft,
  Store,
  Tag,
  FileText,
  Globe,
  Check,
  Loader2,
} from "lucide-react";

const categories = [
  "Fashion & Apparel",
  "Electronics",
  "Home & Living",
  "Food & Beverages",
  "Beauty & Personal Care",
  "Sports & Fitness",
  "Books & Stationery",
  "Art & Crafts",
  "Jewelry & Accessories",
  "Toys & Games",
  "Health & Wellness",
  "Other",
];

export default function CreateStorePage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
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

  let slugTimeout: NodeJS.Timeout;
  const checkSlugAvailability = async (slugToCheck: string) => {
    clearTimeout(slugTimeout);
    setCheckingSlug(true);
    setSlugAvailable(null);

    slugTimeout = setTimeout(async () => {
      const { data } = await supabase
        .from("stores")
        .select("slug")
        .eq("slug", slugToCheck)
        .single();

      setSlugAvailable(!data);
      setCheckingSlug(false);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim() || !slug.trim() || !category) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (slugAvailable === false) {
      setError("This store URL is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to create a store");
      setLoading(false);
      return;
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .insert({
        user_id: user.id, // FIXED: was owner_id, now user_id
        name: name.trim(),
        description: description.trim(),
        slug: slug,
        category: category,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (storeError) {
      setError(storeError.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/${store.slug}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white">
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
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Create your store</h1>
          <p className="text-[#888888]">
            Set up your online store in just a few steps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Store name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Hikari Boutique"
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm"
              />
            </div>
          </div>

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
                placeholder="your-store-name"
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-24 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999999]">
                .hookit.online
              </span>
            </div>
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
            <p className="mt-1 text-xs text-[#999999]">
              This will be your store&apos;s web address. You can change it later.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[#999999]" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers what your store is about..."
                rows={4}
                maxLength={500}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm resize-none"
              />
            </div>
            <p className="mt-1 text-xs text-[#999999] text-right">
              {description.length}/500
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || slugAvailable === false}
            className="w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating your store...
              </>
            ) : (
              "Create store"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}