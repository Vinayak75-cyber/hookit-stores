"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  CreditCard,
  Key,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Check,
  AlertCircle,
  Shield,
  ArrowUpRight,
} from "lucide-react";

export default function PaymentSettingsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
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

  const [form, setForm] = useState({
    razorpay_key_id: "",
    razorpay_key_secret: "",
    currency: "INR",
    test_mode: true,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [connected, setConnected] = useState(false);

  // Fetch payment settings
  useEffect(() => {
    if (!storeSlug) return;

    const fetchSettings = async () => {
      try {
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
          .from("payment_settings")
          .select("*")
          .eq("store_id", store.id)
          .single();

        if (settings) {
          setForm({
            razorpay_key_id: settings.razorpay_key_id || "",
            razorpay_key_secret: settings.razorpay_key_secret ? "••••••••••••" : "",
            currency: settings.currency || "INR",
            test_mode: settings.test_mode ?? true,
          });
          setConnected(!!settings.razorpay_key_id && settings.is_connected);
        }

        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };

    fetchSettings();
  }, [storeSlug, supabase]);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

      const updateData: any = {
        store_id: store.id,
        razorpay_key_id: form.razorpay_key_id.trim(),
        currency: form.currency,
        test_mode: form.test_mode,
        updated_at: new Date().toISOString(),
      };

      // Only update secret if it was changed (not the masked dots)
      if (form.razorpay_key_secret !== "••••••••••••") {
        updateData.razorpay_key_secret = form.razorpay_key_secret.trim();
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save payment settings");
      }

      setConnected(!!form.razorpay_key_id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save payment settings");
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
      <div className="flex items-center gap-4 pt-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#666666]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Payment settings</h1>
          <p className="text-[#888888] text-sm">Connect Razorpay to accept payments</p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-2xl p-4 flex items-center gap-4 ${
          connected ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            connected ? "bg-green-100" : "bg-yellow-100"
          }`}
        >
          {connected ? (
            <Shield className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${connected ? "text-green-700" : "text-yellow-700"}`}>
            {connected ? "Payments are connected" : "Payments are not connected"}
          </p>
          <p className={`text-xs ${connected ? "text-green-600" : "text-yellow-600"}`}>
            {connected
              ? "Your store can now accept payments via Razorpay"
              : "Connect your Razorpay account to start accepting payments"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Razorpay Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Razorpay Credentials */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Razorpay credentials</h2>
                <p className="text-xs text-[#888888]">
                  Find these in your Razorpay Dashboard → Settings → API Keys
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Key ID
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                <input
                  type="text"
                  value={form.razorpay_key_id}
                  onChange={(e) => handleChange("razorpay_key_id", e.target.value)}
                  placeholder="rzp_test_xxxxxxxxxxxx"
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Key Secret
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                <input
                  type={showSecret ? "text" : "password"}
                  value={form.razorpay_key_secret}
                  onChange={(e) => handleChange("razorpay_key_secret", e.target.value)}
                  placeholder="Enter your key secret"
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-12 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#666666] transition-colors"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-[#999999] mt-2">
                Your secret key is encrypted and stored securely.
              </p>
            </div>
          </div>

          {/* How to get keys */}
          <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">How to get your Razorpay keys</h3>
            <ol className="space-y-3">
              {[
                "Login to your Razorpay Dashboard",
                "Go to Settings → API Keys",
                "Generate new test keys (for testing)",
                "Copy the Key ID and Key Secret",
                "Paste them above and save",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#666666]">
                  <span className="w-5 h-5 rounded-full bg-[#1a1a1a] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href="https://dashboard.razorpay.com/app/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-[#1a1a1a] font-medium hover:underline"
            >
              Open Razorpay Dashboard
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Currency & Mode */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Payment options</h2>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all appearance-none bg-white"
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-3">
                Payment mode
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-[#e5e5e5] cursor-pointer hover:border-[#1a1a1a] transition-colors">
                  <input
                    type="radio"
                    name="test_mode"
                    checked={form.test_mode}
                    onChange={() => handleChange("test_mode", true)}
                    className="w-4 h-4 accent-[#1a1a1a]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">Test mode</p>
                    <p className="text-xs text-[#888888]">Use test keys for development. No real money.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-[#e5e5e5] cursor-pointer hover:border-[#1a1a1a] transition-colors">
                  <input
                    type="radio"
                    name="test_mode"
                    checked={!form.test_mode}
                    onChange={() => handleChange("test_mode", false)}
                    className="w-4 h-4 accent-[#1a1a1a]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">Live mode</p>
                    <p className="text-xs text-[#888888]">Use live keys for real transactions</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Error & Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-600 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Payment settings saved successfully
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !storeSlug}
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
                Save payment settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}