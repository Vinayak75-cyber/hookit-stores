"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Store,
  FileText,
  Image,
  Globe,
  Upload,
  X,
  Loader2,
  Save,
  Check,
  Shield,
  Truck,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import imageCompression from "browser-image-compression";

export default function StoreSettingsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [storeSlug, setStoreSlug] = useState<string>("");

  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    slug: "",
    category: "",
    logo_url: "",
    banner_url: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    shipping_policy: "",
    refund_policy: "",
    privacy_policy: "",
    terms_conditions: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  // Fetch store data
  useEffect(() => {
    if (!storeSlug) return;

    const fetchStore = async () => {
      const { data: store } = await supabase
        .from("stores")
        .select("*, store_settings(*)")
        .eq("slug", storeSlug)
        .single();

      if (store) {
        const settings = store.store_settings?.[0] || {};
        setForm({
          name: store.name || "",
          description: store.description || "",
          slug: store.slug || "",
          category: store.category || "",
          logo_url: store.logo_url || "",
          banner_url: store.banner_url || "",
          contact_email: store.contact_email || "",
          contact_phone: store.contact_phone || "",
          address: store.address || "",
          shipping_policy: settings.shipping_policy || "",
          refund_policy: settings.refund_policy || "",
          privacy_policy: settings.privacy_policy || "",
          terms_conditions: settings.terms_conditions || "",
        });
        setLogoPreview(store.logo_url || "");
        setBannerPreview(store.banner_url || "");
      }
      setLoading(false);
    };

    fetchStore();
  }, [storeSlug, supabase]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  // Compress image before upload
  const compressImage = async (file: File, type: "logo" | "banner"): Promise<File> => {
    const options = {
      logo: {
        maxWidthOrHeight: 400,
        maxSizeMB: 0.5,
        useWebWorker: true,
        fileType: "image/webp",
      },
      banner: {
        maxWidthOrHeight: 1920,
        maxSizeMB: 1,
        useWebWorker: true,
        fileType: "image/webp",
      },
    }[type];

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (err) {
      console.error("Compression failed, using original:", err);
      return file;
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB");
      return;
    }

    setError("");
    setSuccess(false);
    setUploadingLogo(true);

    try {
      // Compress in browser
      const compressedFile = await compressImage(file, "logo");
      setLogoFile(compressedFile);
      setLogoPreview(URL.createObjectURL(compressedFile));
    } catch (err: any) {
      setError(err.message || "Failed to process logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB");
      return;
    }

    setError("");
    setSuccess(false);
    setUploadingBanner(true);

    try {
      // Compress in browser
      const compressedFile = await compressImage(file, "banner");
      setBannerFile(compressedFile);
      setBannerPreview(URL.createObjectURL(compressedFile));
    } catch (err: any) {
      setError(err.message || "Failed to process banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setForm((prev) => ({ ...prev, logo_url: "" }));
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview("");
    setForm((prev) => ({ ...prev, banner_url: "" }));
  };

  const uploadImage = async (file: File, type: "logo" | "banner"): Promise<string> => {
    const fileName = `${storeSlug}/${type}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `${type} upload failed`);
    }
    const { url } = await res.json();
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      let logoUrl = form.logo_url;
      let bannerUrl = form.banner_url;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, "logo");
      }
      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, "banner");
      }

      // Update stores table
      const { error: storeError } = await supabase
        .from("stores")
        .update({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          logo_url: logoUrl,
          banner_url: bannerUrl,
          contact_email: form.contact_email.trim(),
          contact_phone: form.contact_phone.trim(),
          address: form.address.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("slug", storeSlug);

      if (storeError) throw storeError;

      // Get store ID for store_settings
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", storeSlug)
        .single();

      if (!storeData) throw new Error("Store not found");

      // Upsert store_settings
      const { error: settingsError } = await supabase
        .from("store_settings")
        .upsert(
          {
            store_id: storeData.id,
            shipping_policy: form.shipping_policy.trim() || null,
            refund_policy: form.refund_policy.trim() || null,
            privacy_policy: form.privacy_policy.trim() || null,
            terms_conditions: form.terms_conditions.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id" }
        );

      if (settingsError) throw settingsError;

      setSuccess(true);
      setLogoFile(null);
      setBannerFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update store");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#999999]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#666666]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Store settings</h1>
          <p className="text-[#888888] text-sm">Manage your store information and policies</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Basic information</h2>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Store name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Your store name"
                  required
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-[#999999]" />
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Tell customers about your store..."
                  rows={4}
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Category
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g., Fashion, Electronics"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Contact information</h2>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Contact email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                placeholder="support@yourstore.com"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Contact phone
              </label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => handleChange("contact_phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Your business address..."
                rows={3}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
              />
            </div>
          </div>

          {/* Store Policies */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1a1a1a] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#666666]" />
              Store policies
            </h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] mb-2">
                <Truck className="w-4 h-4 text-[#999999]" />
                Shipping policy
              </label>
              <textarea
                value={form.shipping_policy}
                onChange={(e) => handleChange("shipping_policy", e.target.value)}
                placeholder="Describe your shipping methods, delivery times, costs, and any restrictions..."
                rows={5}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
              />
              <p className="text-xs text-[#999999] mt-1.5">
                This will be displayed on your store's shipping policy page.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] mb-2">
                <RefreshCw className="w-4 h-4 text-[#999999]" />
                Refund & return policy
              </label>
              <textarea
                value={form.refund_policy}
                onChange={(e) => handleChange("refund_policy", e.target.value)}
                placeholder="Describe your refund conditions, return window, and process..."
                rows={5}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
              />
              <p className="text-xs text-[#999999] mt-1.5">
                This will be displayed on your store's refund policy page.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] mb-2">
                <Shield className="w-4 h-4 text-[#999999]" />
                Privacy policy
              </label>
              <textarea
                value={form.privacy_policy}
                onChange={(e) => handleChange("privacy_policy", e.target.value)}
                placeholder="Describe how you collect, use, and protect customer data..."
                rows={5}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
              />
              <p className="text-xs text-[#999999] mt-1.5">
                This will be displayed on your store's privacy policy page.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] mb-2">
                <FileCheck className="w-4 h-4 text-[#999999]" />
                Terms & conditions
              </label>
              <textarea
                value={form.terms_conditions}
                onChange={(e) => handleChange("terms_conditions", e.target.value)}
                placeholder="Describe the terms customers agree to when using your store..."
                rows={5}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
              />
              <p className="text-xs text-[#999999] mt-1.5">
                This will be displayed on your store's terms & conditions page.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Branding */}
        <div className="space-y-6">
          {/* Store URL */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Store URL</h2>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={form.slug}
                disabled
                className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-20 text-sm text-[#999999] bg-[#fafafa] cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999999]">
                .hookit.online
              </span>
            </div>
            <p className="text-xs text-[#999999]">
              Store URL cannot be changed after creation.
            </p>
          </div>

          {/* Logo Upload */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Store logo</h2>

            {logoPreview ? (
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#f5f5f5] border border-[#e5e5e5]">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="block w-24 h-24 rounded-2xl border-2 border-dashed border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                {uploadingLogo ? (
                  <Loader2 className="w-5 h-5 text-[#999999] animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#999999]" />
                    <span className="text-[10px] text-[#999999]">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
            )}

            <p className="text-xs text-[#999999]">
              Recommended: 400x400px, PNG or JPG
            </p>
          </div>

          {/* Banner Upload */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Store banner</h2>

            {bannerPreview ? (
              <div className="relative">
                <div className="w-full h-32 rounded-2xl overflow-hidden bg-[#f5f5f5] border border-[#e5e5e5]">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="block w-full h-32 rounded-2xl border-2 border-dashed border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                {uploadingBanner ? (
                  <Loader2 className="w-6 h-6 text-[#999999] animate-spin" />
                ) : (
                  <>
                    <Image className="w-6 h-6 text-[#999999]" />
                    <span className="text-sm text-[#999999]">Upload banner</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  disabled={uploadingBanner}
                  className="hidden"
                />
              </label>
            )}

            <p className="text-xs text-[#999999]">
              Recommended: 1200x400px, PNG or JPG
            </p>
          </div>

          {/* Error & Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-600 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Store settings saved successfully
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !storeSlug || uploadingLogo || uploadingBanner}
            className="w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}