"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { createClient } from "@/lib/supabase";
import {
  CreditCard,
  Download,
  Check,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Lock,
  Loader2,
  Receipt,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Bill {
  id: string;
  bill_month: string;
  plan_type: string;
  total_commission: number;
  total_orders_count: number;
  subscription_amount: number;
  total_amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
}

interface BillingData {
  store: {
    subscription_plan: string;
    is_active: boolean;
  };
  currentBill: Bill | null;
  billHistory: Bill[];
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "₹0",
    period: "/month",
    description: "Perfect for beginners",
    commission: "3% commission per sale",
    features: [
      "Professional Online Store",
      "Unlimited Products",
      "Dashboard & Analytics",
      "Connect Your Razorpay",
      "Direct Payments To Bank",
      "Mobile Responsive",
      "Free Hosting & SSL",
    ],
    cta: "Downgrade",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹999",
    period: "/month",
    description: "Best for growing businesses",
    commission: "0% Platform Commission",
    features: [
      "Everything in Starter",
      "0% Platform Commission",
      "Priority Support",
    ],
    cta: "Upgrade To Growth",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹4,999",
    period: "",
    description: "One-time setup fee",
    commission: "₹299/month maintenance",
    features: [
      "Everything in Growth",
      "Multiple Store Themes",
      "Custom Domain Support",
      "Shipping Integration",
      "Advanced Integrations",
      "Future Business Tools",
    ],
    cta: "Coming Soon",
    comingSoon: true,
  },
];

export default function BillingPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { storeSlug } = use(params);

  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch(`/api/billing?storeSlug=${storeSlug}`);
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        setError(result.error || "Failed to load billing data");
      }
    } catch {
      setError("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handlePay = async (bill: Bill) => {
    if (bill.total_amount === 0) return;
    setPaying(true);
    setError("");

    try {
      const orderRes = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: bill.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Failed to create payment");
        setPaying(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hookit",
        description: `Bill for ${new Date(bill.bill_month).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            await fetchBilling();
          } else {
            setError(verifyData.error || "Payment verification failed");
          }
          setPaying(false);
        },
        prefill: {
          name: orderData.storeName,
        },
        theme: {
          color: "#1a1a1a",
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError("Payment failed. Please try again.");
      setPaying(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === "pro") return;
    setUpgrading(planId);
    setError("");

    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug, plan: planId }),
      });

      const result = await res.json();
      if (res.ok) {
        await fetchBilling();
        router.refresh();
      } else {
        setError(result.error || "Upgrade failed");
      }
    } catch {
      setError("Upgrade failed. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const downloadInvoice = (billId: string) => {
    window.open(`/api/billing/invoice?billId=${billId}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      overdue: "bg-red-50 text-red-700 border-red-200",
      waived: "bg-gray-50 text-gray-500 border-gray-200",
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <Check className="w-3.5 h-3.5" />;
      case "overdue":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case "waived":
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-[#999]">
        Failed to load billing data
      </div>
    );
  }

  const currentPlan = data.store.subscription_plan;
  const isStoreActive = data.store.is_active;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="pt-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Billing</h1>
        <p className="text-[#888] text-sm mt-1">Manage your subscription and payments</p>
      </div>

      {/* Billing Support Banner */}
      <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-xl p-4 flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[#1a1a1a] font-medium">
            Need help with billing?
          </p>
          <p className="text-xs text-[#666]">
            Call us at <a href="tel:+918459444524" className="font-semibold text-[#1a1a1a] hover:underline">+91 84594 44524</a> · Mon–Fri, 12:00 PM – 5:00 PM IST
          </p>
        </div>
      </div>

      {/* Store Status Alert */}
      {!isStoreActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Your store is deactivated</p>
            <p className="text-sm text-red-600 mt-0.5">
              Payment for the previous month was not received by the due date. Please pay your pending bill to reactivate your store.
            </p>
          </div>
        </div>
      )}

      {/* Current Bill Card */}
      {data.currentBill && data.currentBill.status !== "waived" && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-[#999]" />
                <span className="text-xs sm:text-sm text-[#999] font-medium uppercase tracking-wide">
                  Current Bill
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
                {new Date(data.currentBill.bill_month).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border self-start ${getStatusBadge(
                data.currentBill.status
              )}`}
            >
              {getStatusIcon(data.currentBill.status)}
              {data.currentBill.status.charAt(0).toUpperCase() + data.currentBill.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-[#f7f7f7] rounded-xl p-4">
              <p className="text-xs text-[#999] mb-1">Total Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
                ₹{data.currentBill.total_amount.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#f7f7f7] rounded-xl p-4">
              <p className="text-xs text-[#999] mb-1">Due Date</p>
              <p className="text-base sm:text-lg font-semibold text-[#1a1a1a]">
                {new Date(data.currentBill.due_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-[#f7f7f7] rounded-xl p-4">
              <p className="text-xs text-[#999] mb-1">Plan</p>
              <p className="text-base sm:text-lg font-semibold text-[#1a1a1a] capitalize">
                {data.currentBill.plan_type}
              </p>
            </div>
          </div>

          {data.currentBill.plan_type === "starter" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#666] mb-4 sm:mb-6">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {data.currentBill.total_orders_count} orders
              </span>
              <span className="hidden sm:inline">•</span>
              <span>3% commission on (subtotal + GST)</span>
            </div>
          )}

          {data.currentBill.plan_type === "growth" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#666] mb-4 sm:mb-6">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Fixed monthly subscription
              </span>
              <span className="hidden sm:inline">•</span>
              <span>0% Platform Commission</span>
            </div>
          )}

          {data.currentBill.status === "pending" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => handlePay(data.currentBill!)}
                disabled={paying || data.currentBill.total_amount === 0}
                className="flex items-center justify-center gap-2 bg-[#1a1a1a] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </>
                )}
              </button>
              <button
                onClick={() => downloadInvoice(data.currentBill!.id)}
                className="flex items-center justify-center gap-2 border border-[#e5e5e5] text-[#1a1a1a] px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            </div>
          )}

          {data.currentBill.status === "paid" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" />
                Paid on {new Date(data.currentBill.paid_at!).toLocaleDateString("en-IN")}
              </div>
              <button
                onClick={() => downloadInvoice(data.currentBill!.id)}
                className="flex items-center justify-center gap-2 border border-[#e5e5e5] text-[#1a1a1a] px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            </div>
          )}

          {data.currentBill.status === "overdue" && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePay(data.currentBill!)}
                disabled={paying}
                className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay Now to Reactivate
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Growth Plan Active - No Bill */}
      {!data.currentBill && currentPlan === "growth" && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#999]" />
                <span className="text-xs sm:text-sm text-[#999] font-medium uppercase tracking-wide">
                  Growth Plan
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Subscription Active</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200 self-start">
              <Check className="w-3.5 h-3.5" />
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-[#f7f7f7] rounded-xl p-4">
              <p className="text-xs text-[#999] mb-1">Monthly Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">₹999.00</p>
            </div>
            <div className="bg-[#f7f7f7] rounded-xl p-4">
              <p className="text-xs text-[#999] mb-1">Next Billing</p>
              <p className="text-base sm:text-lg font-semibold text-[#1a1a1a]">
                1st {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString("default", { month: "long" })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#666]">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              0% Platform Commission
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Fixed monthly subscription</span>
          </div>
        </div>
      )}

      {/* Starter Plan - No Bill */}
      {!data.currentBill && currentPlan !== "growth" && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 text-center">
          <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-[#ddd] mx-auto mb-3" />
          <p className="text-[#999] text-sm">No pending bills to pay.</p>
          <p className="text-[#bbb] text-xs mt-1">You're all caught up! Next bill generates on the 1st of next month.</p>
        </div>
      )}

      {/* Bill History */}
      {data.billHistory.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-3 sm:mb-4">Bill History</h3>
          <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <div className="px-6 py-4 border-b border-[#f0f0f0]">
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Bill History</h3>
              </div>
              <div className="divide-y divide-[#f0f0f0]">
                {data.billHistory.map((bill) => (
                  <div key={bill.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-[#999]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                          {new Date(bill.bill_month).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[#999] capitalize">{bill.plan_type} Plan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#1a1a1a]">
                          ₹{bill.total_amount.toFixed(2)}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${getStatusBadge(
                            bill.status
                          )} px-2 py-0.5 rounded-full border mt-0.5`}
                        >
                          {getStatusIcon(bill.status)}
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </div>
                      <button
                        onClick={() => downloadInvoice(bill.id)}
                        className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4 text-[#999]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-[#f0f0f0]">
              {data.billHistory.map((bill) => (
                <div key={bill.id} className="p-4 active:bg-[#fafafa] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-[#999]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                          {new Date(bill.bill_month).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[#999] capitalize">{bill.plan_type} Plan</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadInvoice(bill.id)}
                      className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4 text-[#999]" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      ₹{bill.total_amount.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${getStatusBadge(
                        bill.status
                      )} px-2.5 py-1 rounded-full border`}
                    >
                      {getStatusIcon(bill.status)}
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plans */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-4 sm:mb-6">Upgrade Your Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPro = plan.id === "pro";

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-4 sm:p-6 ${
                  isCurrent
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                    : plan.popular && !isCurrent
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                    : "border-[#e5e5e5] bg-white"
                }`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-[#1a1a1a] text-xs font-semibold px-3 py-1 rounded-full border border-[#e5e5e5]">
                      Most Popular
                    </span>
                  </div>
                )}

                {isPro && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <span className="bg-[#f0f0f0] text-[#999] text-xs font-medium px-2.5 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-bold mb-1">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl sm:text-3xl font-extrabold">{plan.price}</span>
                    <span
                      className={`text-sm ${
                        isCurrent || plan.popular ? "text-gray-400" : "text-[#999]"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      isCurrent || plan.popular ? "text-gray-400" : "text-[#999]"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`rounded-lg p-3 mb-4 sm:mb-6 text-sm font-medium ${
                    isCurrent || plan.popular
                      ? "bg-white/10 text-white"
                      : "bg-[#f7f7f7] text-[#1a1a1a]"
                  }`}
                >
                  {plan.commission}
                </div>

                <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isCurrent || plan.popular ? "text-white" : "text-[#1a1a1a]"
                        }`}
                      />
                      <span
                        className={
                          isCurrent || plan.popular ? "text-gray-300" : "text-[#666]"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isPro || upgrading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "bg-white/10 text-white cursor-default"
                      : plan.popular && !isCurrent
                      ? "bg-white text-[#1a1a1a] hover:bg-gray-100 disabled:opacity-50"
                      : isPro
                      ? "bg-[#f5f5f5] text-[#bbb] cursor-not-allowed"
                      : "bg-[#1a1a1a] text-white hover:bg-[#333] disabled:opacity-50"
                  }`}
                >
                  {upgrading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upgrading...
                    </span>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : isPro ? (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Coming Soon
                    </span>
                  ) : plan.id === "starter" && currentPlan === "growth" ? (
                    "Downgrade"
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}