"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Palette,
  Type,
  Layout,
  Monitor,
  Smartphone,
  Save,
  Loader2,
  Check,
  Eye,
  Undo,
} from "lucide-react";

interface ThemeSettings {
  theme_name: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  border_radius: string;
  show_logo: boolean;
  show_banner: boolean;
  banner_height: string;
  product_grid_columns: number;
  show_search: boolean;
}

const defaultTheme: ThemeSettings = {
  theme_name: "minimal",
  primary_color: "#1a1a1a",
  background_color: "#ffffff",
  text_color: "#1a1a1a",
  accent_color: "#c9a96e",
  font_family: "Inter",
  border_radius: "12px",
  show_logo: true,
  show_banner: true,
  banner_height: "400px",
  product_grid_columns: 3,
  show_search: true,
};

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Georgia", label: "Georgia" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Playfair", label: "Playfair Display" },
];

const borderRadiusOptions = [
  { value: "0px", label: "Sharp" },
  { value: "8px", label: "Small" },
  { value: "12px", label: "Medium" },
  { value: "16px", label: "Large" },
  { value: "24px", label: "XL" },
];

const bannerHeightOptions = [
  { value: "300px", label: "Small" },
  { value: "400px", label: "Medium" },
  { value: "500px", label: "Large" },
  { value: "600px", label: "Full" },
];

export default function ThemeEditorPage({ params }: { params: Promise<{ storeSlug: string }> }) {
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
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "layout">("colors");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

  useEffect(() => {
    if (!storeSlug) return;

    const fetchTheme = async () => {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", storeSlug)
        .single();

      if (!store) {
        setLoading(false);
        return;
      }

      const { data: settings } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("store_id", store.id)
        .single();

      if (settings) {
        setTheme({
          theme_name: settings.theme_name || "minimal",
          primary_color: settings.primary_color || "#1a1a1a",
          background_color: settings.background_color || "#ffffff",
          text_color: settings.text_color || "#1a1a1a",
          accent_color: settings.accent_color || "#c9a96e",
          font_family: settings.font_family || "Inter",
          border_radius: settings.border_radius || "12px",
          show_logo: settings.show_logo ?? true,
          show_banner: settings.show_banner ?? true,
          banner_height: settings.banner_height || "400px",
          product_grid_columns: settings.product_grid_columns || 3,
          show_search: settings.show_search ?? true,
        });
      }

      setLoading(false);
    };

    fetchTheme();
  }, [storeSlug, supabase]);

  const handleChange = (field: keyof ThemeSettings, value: string | boolean | number) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", storeSlug)
        .single();

      if (!store) throw new Error("Store not found");

      const { error: upsertError } = await supabase
        .from("theme_settings")
        .upsert({
          store_id: store.id,
          ...theme,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'store_id'
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save theme settings");
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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#666666]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Theme editor</h1>
            <p className="text-[#888888] text-sm">Customize your store appearance</p>
          </div>
        </div>
        <Link
          href={`/${storeSlug}`}
          target="_blank"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors self-start sm:self-auto"
        >
          <Eye className="w-4 h-4" />
          Preview
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:h-[calc(100vh-200px)]">
        {/* Left Sidebar - Editor */}
        <div className="lg:col-span-2 bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[#e5e5e5]">
            {[
              { key: "colors" as const, label: "Colors", icon: Palette },
              { key: "typography" as const, label: "Type", icon: Type },
              { key: "layout" as const, label: "Layout", icon: Layout },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 text-xs sm:text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "text-[#1a1a1a] border-b-2 border-[#1a1a1a]"
                    : "text-[#999999] hover:text-[#666666]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </button>
            ))}
          </div>

          {/* Editor Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {activeTab === "colors" && (
              <div className="space-y-4 sm:space-y-5">
                <h3 className="text-xs sm:text-sm font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  Colors
                </h3>

                {[
                  { field: "primary_color" as const, label: "Primary color" },
                  { field: "background_color" as const, label: "Background color" },
                  { field: "text_color" as const, label: "Text color" },
                  { field: "accent_color" as const, label: "Accent color" },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      {label}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-[#e5e5e5] cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={theme[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className="flex-1 border border-[#e5e5e5] rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 text-sm font-mono text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "typography" && (
              <div className="space-y-4 sm:space-y-5">
                <h3 className="text-xs sm:text-sm font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  Typography
                </h3>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Font family
                  </label>
                  <select
                    value={theme.font_family}
                    onChange={(e) => handleChange("font_family", e.target.value)}
                    className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all appearance-none bg-white"
                  >
                    {fontOptions.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Border radius
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {borderRadiusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange("border_radius", option.value)}
                        className={`py-2 px-1 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                          theme.border_radius === option.value
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-[#f5f5f5] text-[#666666] hover:bg-[#e5e5e5]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "layout" && (
              <div className="space-y-4 sm:space-y-5">
                <h3 className="text-xs sm:text-sm font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  Layout
                </h3>

                {[
                  { field: "show_logo" as const, label: "Show logo", desc: "Display store logo in header" },
                  { field: "show_banner" as const, label: "Show banner", desc: "Display banner on store homepage" },
                  { field: "show_search" as const, label: "Show search", desc: "Display search bar in header" },
                ].map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-[#e5e5e5]">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
                      <p className="text-xs text-[#888888]">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange(field, !theme[field])}
                      className={`w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-all shrink-0 ${
                        theme[field] ? "bg-[#1a1a1a]" : "bg-[#e5e5e5]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-sm transition-all ${
                          theme[field] ? "translate-x-5 sm:translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}

                {theme.show_banner && (
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      Banner height
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {bannerHeightOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleChange("banner_height", option.value)}
                          className={`py-2 px-1 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                            theme.banner_height === option.value
                              ? "bg-[#1a1a1a] text-white"
                              : "bg-[#f5f5f5] text-[#666666] hover:bg-[#e5e5e5]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Product grid columns
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => handleChange("product_grid_columns", cols)}
                        className={`py-2 px-1 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                          theme.product_grid_columns === cols
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-[#f5f5f5] text-[#666666] hover:bg-[#e5e5e5]"
                        }`}
                      >
                        {cols} cols
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error & Success */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-green-600 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Theme saved successfully
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 sm:pt-4 border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
              >
                <Undo className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                type="submit"
                disabled={saving || !storeSlug}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save theme</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - Live Preview */}
        <div className="lg:col-span-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-0">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[#e5e5e5] bg-white">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#999999]" />
              <span className="text-sm font-medium text-[#1a1a1a]">Live preview</span>
            </div>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-lg p-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-md transition-all ${
                  previewMode === "desktop" ? "bg-white shadow-sm" : "text-[#999999]"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-md transition-all ${
                  previewMode === "mobile" ? "bg-white shadow-sm" : "text-[#999999]"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-start justify-center">
            <div
              className={`bg-white shadow-lg transition-all duration-300 ${
                previewMode === "mobile" ? "w-full max-w-[375px]" : "w-full max-w-4xl"
              }`}
              style={{
                borderRadius: theme.border_radius,
                fontFamily: theme.font_family,
                minHeight: "500px",
              }}
            >
              {/* Mock Store Header */}
              <div
                className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b"
                style={{
                  backgroundColor: theme.background_color,
                  borderColor: theme.border_radius === "0px" ? "#e5e5e5" : "transparent",
                }}
              >
                {theme.show_logo && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: theme.primary_color }}
                    >
                      S
                    </div>
                    <span className="font-semibold text-sm sm:text-base" style={{ color: theme.text_color }}>
                      Store
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-4">
                  {theme.show_search && (
                    <div
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs"
                      style={{
                        backgroundColor: "#f5f5f5",
                        color: theme.text_color,
                      }}
                    >
                      Search...
                    </div>
                  )}
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: theme.primary_color, color: "#fff" }}
                  >
                    C
                  </div>
                </div>
              </div>

              {/* Mock Banner */}
              {theme.show_banner && (
                <div
                  className="relative flex items-center justify-center px-4"
                  style={{
                    height: previewMode === "mobile" ? "200px" : theme.banner_height,
                    backgroundColor: theme.primary_color,
                  }}
                >
                  <div className="text-center">
                    <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Welcome to our store</h2>
                    <p className="text-white/70 text-xs sm:text-sm">Discover amazing products</p>
                    <button
                      className="mt-3 sm:mt-4 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium"
                      style={{
                        backgroundColor: theme.accent_color,
                        color: "#fff",
                      }}
                    >
                      Shop now
                    </button>
                  </div>
                </div>
              )}

              {/* Mock Product Grid */}
              <div className="p-4 sm:p-6">
                <h3
                  className="text-base sm:text-lg font-semibold mb-3 sm:mb-4"
                  style={{ color: theme.text_color }}
                >
                  Featured products
                </h3>
                <div
                  className="grid gap-3 sm:gap-4"
                  style={{
                    gridTemplateColumns: previewMode === "mobile"
                      ? "repeat(2, 1fr)"
                      : `repeat(${theme.product_grid_columns}, 1fr)`,
                  }}
                >
                  {Array.from({ length: previewMode === "mobile" ? 4 : 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="border overflow-hidden"
                      style={{
                        borderRadius: theme.border_radius,
                        borderColor: "#e5e5e5",
                      }}
                    >
                      <div
                        className="aspect-square"
                        style={{ backgroundColor: "#f5f5f5" }}
                      />
                      <div className="p-2 sm:p-3">
                        <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text_color }}>
                          Product {i + 1}
                        </p>
                        <p className="text-xs mt-0.5 sm:mt-1" style={{ color: theme.accent_color }}>
                          ₹{(i + 1) * 999}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}