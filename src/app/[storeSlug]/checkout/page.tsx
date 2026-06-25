"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Truck,
  Check,
  Loader2,
  Lock,
  Package,
  Percent,
  Hash,
  Sparkles,
  Globe,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";

// Razorpay window type
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [storeSlug, setStoreSlug] = useState<string>("");

  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);

  const { items, clearCart } = useCartStore();
  const storeItems = items.filter((item) => item.storeSlug === storeSlug);

  // ====== CALCULATIONS ======
  const getItemUnitTotal = (item: any) => {
    let unitTotal = item.price;
    unitTotal += item.shippingFee || 0;
    unitTotal += item.additionalFee || 0;
    let platformFee = item.platformFee || 0;
    if (item.platformFeeType === "percentage" && platformFee > 0) {
      platformFee = (item.price * platformFee) / 100;
    }
    unitTotal += platformFee;
    if (item.gstMode === "excluded" && ((item.gstPercentage || 0) > 0)) {
      unitTotal += (item.price * (item.gstPercentage || 0)) / 100;
    }
    if (item.customFields) {
      unitTotal += item.customFields.reduce((s: number, cf: any) => s + (cf.additionalPrice || 0), 0);
    }
    return unitTotal;
  };

  const subtotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalShipping = storeItems.reduce((sum, item) => sum + (item.shippingFee || 0) * item.quantity, 0);
  const totalAdditional = storeItems.reduce((sum, item) => sum + (item.additionalFee || 0) * item.quantity, 0);
  const totalPlatform = storeItems.reduce((sum, item) => {
    let fee = item.platformFee || 0;
    if (item.platformFeeType === "percentage" && fee > 0) {
      fee = (item.price * fee) / 100;
    }
    return sum + fee * item.quantity;
  }, 0);
  const totalGST = storeItems.reduce((sum, item) => {
    if (item.gstMode === "excluded" && ((item.gstPercentage || 0) > 0)) {
      return sum + (item.price * (item.gstPercentage || 0) / 100) * item.quantity;
    }
    return sum;
  }, 0);
  const totalCustomFields = storeItems.reduce((sum, item) => {
    if (item.customFields) {
      return sum + item.customFields.reduce((s: number, cf: any) => s + (cf.additionalPrice || 0), 0) * item.quantity;
    }
    return sum;
  }, 0);
  const grandTotal = storeItems.reduce((sum, item) => sum + getItemUnitTotal(item) * item.quantity, 0);
  const totalSavings = storeItems.reduce((sum, item) => sum + ((item.comparePrice || item.price) - item.price) * item.quantity, 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"info" | "payment" | "success">("info");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setRazorpayLoaded(false);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      setError("Payment gateway is loading. Please wait...");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: store } = await supabase
        .from("stores")
        .select("id, name")
        .eq("slug", storeSlug)
        .single();

      if (!store) throw new Error("Store not found");

      // 1. Create order via API (this creates Razorpay order + DB order)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
          total_amount: grandTotal,
          subtotal: subtotal,
          shipping_fee: totalShipping,
          additional_fee: totalAdditional,
          platform_fee: totalPlatform,
          gst_amount: totalGST,
          custom_fields_total: totalCustomFields,
          order_items: storeItems.map((item) => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: getItemUnitTotal(item) * item.quantity,
            variant_name: item.variantName,
            sku: item.sku,
            shipping_fee: (item.shippingFee || 0) * item.quantity,
            additional_fee: (item.additionalFee || 0) * item.quantity,
            platform_fee: item.platformFeeType === "percentage" && (item.platformFee || 0) > 0
              ? (item.price * (item.platformFee || 0) / 100) * item.quantity
              : (item.platformFee || 0) * item.quantity,
            gst_amount: item.gstMode === "excluded" && ((item.gstPercentage || 0) > 0)
              ? (item.price * (item.gstPercentage || 0) / 100) * item.quantity
              : 0,
            custom_fields: item.customFields,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create order");

      const { razorpay_order_id, razorpay_key_id, amount, currency, order } = data;

      // 2. Open Razorpay checkout
      const options = {
        key: razorpay_key_id,
        amount: amount,
        currency: currency,
        name: store.name,
        description: `Order from ${store.name}`,
        order_id: razorpay_order_id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#1a1a1a",
        },
        handler: async function (response: any) {
          // 3. Payment successful — verify signature
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
                store_slug: storeSlug,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              setError(verifyData.error || "Payment verification failed");
              setLoading(false);
              return;
            }

            // 4. Success! Clear cart and show success
            clearCart();
            setStep("success");
            setLoading(false);
          } catch (err: any) {
            setError(err.message || "Payment verification failed");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Payment failed");
      setLoading(false);
    }
  };

  if (storeItems.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-[#cccccc]" />
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Your cart is empty</h2>
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Order placed!</h2>
          <p className="text-[#888888] text-sm mb-6">
            Thank you for your purchase. We&apos;ll send you a confirmation email shortly.
          </p>
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <header className="bg-white border-b border-[#e5e5e5]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/${storeSlug}/cart`}
            className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to cart
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${step === "info" ? "bg-[#1a1a1a] text-white" : "bg-green-50 text-green-600"}`}>
              {step === "info" ? "1" : <Check className="w-4 h-4" />}
            </div>
            <div className="w-8 h-px bg-[#e5e5e5]" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${step === "payment" ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#999999]"}`}>
              2
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ====== ORDER SUMMARY ====== */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">Order summary</h3>
          <div className="space-y-3">
            {storeItems.map((item) => {
              const unitTotal = getItemUnitTotal(item);
              const lineTotal = unitTotal * item.quantity;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#f5f5f5] overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 m-3 text-[#cccccc]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-[#999999] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />{item.variantName}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-[#999999] flex items-center gap-1">
                        <Hash className="w-3 h-3" />{item.sku}
                      </p>
                    )}
                    <p className="text-xs text-[#999999]">Qty: {item.quantity} × ₹{unitTotal.toLocaleString()}</p>
                    {item.isDigital && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] mt-1">
                        <Globe className="w-2.5 h-2.5" />Digital
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#1a1a1a] shrink-0">
                    ₹{lineTotal.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-[#e5e5e5] mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#666666]">Subtotal</span>
              <span className="text-[#1a1a1a]">₹{subtotal.toLocaleString()}</span>
            </div>
            {totalShipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Shipping</span>
                <span className="text-[#1a1a1a]">₹{totalShipping.toLocaleString()}</span>
              </div>
            )}
            {totalAdditional > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">Additional fees</span>
                <span className="text-[#1a1a1a]">₹{totalAdditional.toLocaleString()}</span>
              </div>
            )}
            {totalPlatform > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">Platform fees</span>
                <span className="text-[#1a1a1a]">₹{totalPlatform.toLocaleString()}</span>
              </div>
            )}
            {totalGST > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><Percent className="w-3.5 h-3.5" />GST</span>
                <span className="text-[#1a1a1a]">₹{totalGST.toLocaleString()}</span>
              </div>
            )}
            {totalCustomFields > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Custom options</span>
                <span className="text-[#1a1a1a]">₹{totalCustomFields.toLocaleString()}</span>
              </div>
            )}
            {totalShipping === 0 && totalAdditional === 0 && totalPlatform === 0 && totalGST === 0 && totalCustomFields === 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#e5e5e5]">
              <span className="text-[#1a1a1a]">Total</span>
              <span className="text-[#1a1a1a]">₹{grandTotal.toLocaleString()}</span>
            </div>
            {totalSavings > 0 && (
              <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                <Info className="w-3 h-3" />You saved ₹{totalSavings.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {step === "info" ? (
          <form onSubmit={handleSubmitInfo} className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Shipping information</h3>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street address, apartment, etc."
                rows={3}
                required
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Mumbai"
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">PIN</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="400001"
                  className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white font-semibold py-4 rounded-xl hover:bg-[#333333] transition-colors flex items-center justify-center gap-2"
            >
              Continue to payment
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </form>
        ) : (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Payment</h3>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f5f5]">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#1a1a1a]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Razorpay</p>
                <p className="text-xs text-[#888888]">Cards, UPI, Net Banking, Wallets</p>
              </div>
              <Lock className="w-4 h-4 text-green-600 ml-auto" />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#e5e5e5]">
              <Truck className="w-5 h-5 text-[#999999]" />
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">{totalShipping > 0 ? `Shipping: ₹${totalShipping.toLocaleString()}` : "Free shipping"}</p>
                <p className="text-xs text-[#888888]">Delivery in 5-7 business days</p>
              </div>
            </div>

            {/* Final total box */}
            <div className="p-4 rounded-xl bg-[#f8f8f8] space-y-1.5">
              <p className="text-xs font-medium text-[#1a1a1a] mb-2">Final amount</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">Subtotal</span>
                <span className="text-[#1a1a1a]">₹{subtotal.toLocaleString()}</span>
              </div>
              {totalShipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Shipping</span>
                  <span className="text-[#1a1a1a]">₹{totalShipping.toLocaleString()}</span>
                </div>
              )}
              {totalAdditional > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Additional</span>
                  <span className="text-[#1a1a1a]">₹{totalAdditional.toLocaleString()}</span>
                </div>
              )}
              {totalPlatform > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Platform fee</span>
                  <span className="text-[#1a1a1a]">₹{totalPlatform.toLocaleString()}</span>
                </div>
              )}
              {totalGST > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">GST</span>
                  <span className="text-[#1a1a1a]">₹{totalGST.toLocaleString()}</span>
                </div>
              )}
              {totalCustomFields > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Custom options</span>
                  <span className="text-[#1a1a1a]">₹{totalCustomFields.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-[#e5e5e5] pt-2">
                <span className="text-[#1a1a1a]">Total</span>
                <span className="text-[#1a1a1a]">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="w-full bg-[#1a1a1a] text-white font-semibold py-4 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : !razorpayLoaded ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading payment gateway...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{grandTotal.toLocaleString()}
                </>
              )}
            </button>

            <p className="text-xs text-[#999999] text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secure payment powered by Razorpay
            </p>
          </div>
        )}
      </div>
    </div>
  );
}