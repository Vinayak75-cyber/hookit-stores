"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Calendar, Package, IndianRupee, FileText } from "lucide-react";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

interface Summary {
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  from: string;
  to: string;
  statusBreakdown: Record<string, number>;
}

interface Store {
  id: string;
  name: string;
}

export default function ExportPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const [storeSlug, setStoreSlug] = useState<string>("");
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);

  useEffect(() => {
    if (!storeSlug || !from || !to) return;

    async function fetchData() {
      try {
        const res = await fetch(
          `/api/dashboard/${storeSlug}/orders/export?from=${from}&to=${to}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStore(data.store);
        setOrders(data.orders);
        setSummary(data.summary);
      } catch (err) {
        setError("Failed to load export data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [storeSlug, from, to]);

  // Auto-trigger print when data loads
  useEffect(() => {
    if (!loading && orders.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, orders]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    pending: "#eab308",
    paid: "#22c55e",
    shipped: "#6366f1",
    delivered: "#3b82f6",
    cancelled: "#ef4444",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#e5e5e5] border-t-[#1a1a1a] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#888888]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page { margin: 15mm; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-[#1a1a1a]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBag className="w-7 h-7 text-[#1a1a1a]" />
              <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">hookit</h1>
            </div>
            <p className="text-sm text-[#888888]">Order Report</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-[#1a1a1a]">{store?.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-[#666666] mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(from!)} — {formatDate(to!)}</span>
            </div>
            <p className="text-xs text-[#999999] mt-1">
              Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-5 mb-10">
          <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[#666666]">Total Sales</span>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a]">
              ₹{summary?.totalSales.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[#666666]">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a]">{summary?.totalOrders}</p>
          </div>

          <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[#666666]">Items Sold</span>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a]">{summary?.totalItems}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        {summary && Object.keys(summary.statusBreakdown).length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 uppercase tracking-wider">
              Order Status Breakdown
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e5e5e5] bg-white"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: statusColors[status] || "#999" }}
                  />
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    {statusLabels[status] || status}
                  </span>
                  <span className="text-sm text-[#888888]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div>
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 uppercase tracking-wider">
            Order Details
          </h3>

          {orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#e5e5e5] rounded-2xl">
              <p className="text-[#888888]">No orders found for this period.</p>
            </div>
          ) : (
            <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-semibold text-[#666666] uppercase tracking-wider px-5 py-3.5">
                      Order ID
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666666] uppercase tracking-wider px-5 py-3.5">
                      Date
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666666] uppercase tracking-wider px-5 py-3.5">
                      Customer
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666666] uppercase tracking-wider px-5 py-3.5">
                      Items
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666666] uppercase tracking-wider px-5 py-3.5">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-[#666666] uppercase tracking-wider px-5 py-3.5">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`border-b border-[#f0f0f0] ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-mono text-[#1a1a1a]">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#666666]">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#1a1a1a]">
                        <div>
                          <p className="font-medium">{order.customer_name || "Guest"}</p>
                          <p className="text-xs text-[#888888]">{order.customer_email || "—"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#666666]">
                        {order.order_items?.length || 0} item(s)
                        <p className="text-xs text-[#999999] mt-0.5">
                          {order.order_items?.map((i) => i.product_name).join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${statusColors[order.status] || "#999"}15`,
                            color: statusColors[order.status] || "#999",
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statusColors[order.status] || "#999" }}
                          />
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#1a1a1a] text-right">
                        ₹{order.total_amount?.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1a1a1a]">
                    <td colSpan={5} className="px-5 py-4 text-sm font-semibold text-white">
                      Total Sales
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-white text-right">
                      ₹{summary?.totalSales.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#e5e5e5] text-center">
          <p className="text-xs text-[#bbbbbb]">
            This report was generated by <span className="font-semibold text-[#888888]">hookit</span>
          </p>
          <p className="text-xs text-[#bbbbbb] mt-1">
            hookit.online · Simple stores, powerful stories
          </p>
        </div>

        {/* Print Button (screen only) */}
        <div className="no-print fixed bottom-6 right-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium shadow-lg hover:bg-[#333333] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}