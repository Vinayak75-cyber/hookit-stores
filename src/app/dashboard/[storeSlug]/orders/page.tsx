import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { WhatsAppNotifyButton } from "../../../../components/dashboard/whatsapp-notify-button";
import { OrderStatusDropdown } from "../../../../components/dashboard/order-status-dropdown";
import { DownloadInvoiceButton } from "../../../../components/dashboard/download-invoice-button";

async function getOrders(storeSlug: string, statusFilter?: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", storeSlug)
    .eq("user_id", user.id)
    .single();

  if (!store) return null;

    let query = supabase
    .from("orders")
    .select(`
      *,
      order_items(
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price,
        products(
          id,
          name,
          sku,
          product_images(
            image_url
          )
        )
      )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: orders, error: ordersError } = await query;

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
  }

  const { data: statusCounts } = await supabase
    .from("orders")
    .select("status")
    .eq("store_id", store.id);

  const counts = {
    all: statusCounts?.length || 0,
    pending: statusCounts?.filter((o) => o.status === "pending").length || 0,
    paid: statusCounts?.filter((o) => o.status === "paid").length || 0,
    shipped: statusCounts?.filter((o) => o.status === "shipped").length || 0,
    delivered: statusCounts?.filter((o) => o.status === "delivered").length || 0,
    cancelled: statusCounts?.filter((o) => o.status === "cancelled").length || 0,
  };

  return { store, orders: orders || [], counts };
}

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { storeSlug } = await params;
  const { status } = await searchParams;
  const data = await getOrders(storeSlug, status);

  if (!data) {
    redirect("/login");
  }

  const { store, orders, counts } = data;

  const statusTabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "paid", label: "Paid", count: counts.paid },
    { key: "shipped", label: "Shipped", count: counts.shipped },
    { key: "delivered", label: "Delivered", count: counts.delivered },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pending" },
    paid: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Paid" },
    shipped: { icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50", label: "Shipped" },
    delivered: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", label: "Delivered" },
    cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Cancelled" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Orders</h1>
        <p className="text-[#888888] text-sm mt-1">
          Manage and track your customer orders
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.key}
            href={
              tab.key === "all"
                ? `/dashboard/${storeSlug}/orders`
                : `/dashboard/${storeSlug}/orders?status=${tab.key}`
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              (status === tab.key) || (tab.key === "all" && !status)
                ? "bg-[#1a1a1a] text-white"
                : "bg-white border border-[#e5e5e5] text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                (status === tab.key) || (tab.key === "all" && !status)
                  ? "bg-white/20 text-white"
                  : "bg-[#f5f5f5] text-[#888888]"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
          />
        </div>
        <button className="flex items-center gap-2 border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-sm text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-[#cccccc]" />
          </div>
          <h3 className="text-lg font-medium text-[#1a1a1a] mb-2">No orders yet</h3>
          <p className="text-[#888888] text-sm max-w-sm mx-auto">
            Orders will appear here once customers start purchasing from your store.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const items = order.order_items || [];
            const itemCount = items.length;

            return (
              <div
                key={order.id}
                className="bg-white border border-[#e5e5e5] rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-[#999999]">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <p className="text-lg font-bold text-[#1a1a1a]">
                      ₹{order.total_amount?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
<div className="space-y-3 mb-5">
  {items.map((item: any, idx: number) => {
    const product = item.products;
    const productImage = product?.product_images?.[0]?.image_url;
    const productName = item.product_name || product?.name || "Unknown Product";
    const sku = product?.sku || "—";
    
    return (
      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-[#f8f8f8]">
        {/* Product Image */}
        <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0 border border-[#e5e5e5]">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-5 h-5 text-[#cccccc]" />
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1a1a1a] truncate">
            {productName}
          </p>
          <p className="text-xs text-[#888888] mt-0.5">
            SKU: <span className="font-mono text-[#666666]">{sku}</span>
          </p>
          <p className="text-xs text-[#888888] mt-0.5">
            Qty: {item.quantity || 1} × ₹{item.unit_price?.toLocaleString("en-IN")}
          </p>
        </div>
        
        {/* Total Price */}
        <p className="text-sm font-semibold text-[#1a1a1a]">
          ₹{item.total_price?.toLocaleString("en-IN")}
        </p>
      </div>
    );
  })}
</div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-[#f8f8f8]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                      <User className="w-4 h-4 text-[#999999]" />
                      <span className="font-medium">{order.customer_name || "Guest"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#666666]">
                      <Mail className="w-4 h-4 text-[#999999]" />
                      <span>{order.customer_email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#666666]">
                      <Phone className="w-4 h-4 text-[#999999]" />
                      <span>{order.customer_phone || "No phone"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[#666666]">
                    <MapPin className="w-4 h-4 text-[#999999] shrink-0 mt-0.5" />
                    <span>{order.customer_address || "No address"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#e5e5e5]">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/${storeSlug}/orders/${order.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors border border-[#e5e5e5]"
                    >
                      <Eye className="w-4 h-4" />
                      View details
                    </Link>
                    <DownloadInvoiceButton
                      order={order}
                      storeName={store.name}
                      storeSlug={storeSlug}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <WhatsAppNotifyButton
                      customerPhone={order.customer_phone}
                      customerName={order.customer_name}
                      orderId={order.id}
                      orderStatus={order.status}
                      storeName={store.name}
                      productNames={items.map((item: any) => item.product_name || item.products?.name || "Product")}
                      totalAmount={order.total_amount}
                    />
                    <OrderStatusDropdown
                      orderId={order.id}
                      currentStatus={order.status}
                      storeSlug={storeSlug}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-sm text-[#bbbbbb]">Powered by hookit</p>
      </div>
    </div>
  );
}