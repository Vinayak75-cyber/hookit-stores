import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import CopyButton from "@/components/CopyButton";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Palette,
  CreditCard,
  ExternalLink,
} from "lucide-react";

async function getStoreData(storeSlug: string) {
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
    .select("*")
    .eq("slug", storeSlug)
    .eq("user_id", user.id)
    .single();

  if (!store) return null;

  const { data: analytics } = await supabase
    .from("analytics")
    .select("*")
    .eq("store_id", store.id)
    .order("date", { ascending: false })
    .limit(30);

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: productsCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalCustomers = new Set(orders?.map((o) => o.customer_email)).size || 0;
  const totalViews = analytics?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;

  return {
    store,
    stats: {
      revenue: totalRevenue,
      orders: totalOrders,
      products: productsCount || 0,
      customers: totalCustomers,
      views: totalViews,
    },
    recentOrders: orders?.slice(0, 5) || [],
  };
}

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const data = await getStoreData(storeSlug);

  if (!data) {
    notFound();
  }

  const { store, stats, recentOrders } = data;

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+12%",
      up: true,
      color: "bg-green-50 text-green-600",
      fullWidth: true,
    },
    {
      title: "Orders",
      value: stats.orders.toString(),
      icon: ShoppingCart,
      change: "+8%",
      up: true,
      color: "bg-blue-50 text-blue-600",
      fullWidth: false,
    },
    {
      title: "Products",
      value: stats.products.toString(),
      icon: Package,
      change: "+3",
      up: true,
      color: "bg-purple-50 text-purple-600",
      fullWidth: false,
    },
    {
      title: "Customers",
      value: stats.customers.toString(),
      icon: Users,
      change: "+15%",
      up: true,
      color: "bg-orange-50 text-orange-600",
      fullWidth: false,
    },
    {
      title: "Store Views",
      value: stats.views.toLocaleString(),
      icon: Eye,
      change: "+24%",
      up: true,
      color: "bg-pink-50 text-pink-600",
      fullWidth: false,
    },
  ];

  const quickActions = [
    {
      title: "Add Product",
      description: "Add a new product",
      icon: Plus,
      href: `/dashboard/${storeSlug}/products/new`,
      color: "bg-[#1a1a1a] text-white",
    },
    {
      title: "Store Settings",
      description: "Update store info",
      icon: Settings,
      href: `/dashboard/${storeSlug}/settings`,
      color: "bg-[#f5f5f5] text-[#1a1a1a]",
    },
    {
      title: "Edit Theme",
      description: "Customize look",
      icon: Palette,
      href: `/dashboard/${storeSlug}/theme`,
      color: "bg-[#f5f5f5] text-[#1a1a1a]",
    },
    {
      title: "Payments",
      description: "Connect gateway",
      icon: CreditCard,
      href: `/dashboard/${storeSlug}/payments`,
      color: "bg-[#f5f5f5] text-[#1a1a1a]",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - Desktop */}
      <div className="hidden lg:flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{store.name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Link
              href={`https://${storeSlug}.hookit.online`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888888] text-sm hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5 group"
            >
              {storeSlug}.hookit.online
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <CopyButton text={`https://${storeSlug}.hookit.online`} />
          </div>
          <p className="text-[#aaaaaa] text-xs mt-2">
            Copy this link and share it on your social media, WhatsApp status, or anywhere your customers can find you.
          </p>
        </div>
        <Link
          href={`/${storeSlug}`}
          target="_blank"
          className="flex items-center gap-2 text-sm text-[#1a1a1a] hover:text-[#666666] transition-colors"
        >
          View store
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden pt-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#1a1a1a]">{store.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Link
                href={`https://${storeSlug}.hookit.online`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#888888] text-sm hover:text-[#1a1a1a] transition-colors flex items-center gap-1 group truncate"
              >
                {storeSlug}.hookit.online
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
              <CopyButton text={`https://${storeSlug}.hookit.online`} />
            </div>
            <p className="text-[#aaaaaa] text-xs mt-1.5">
              Copy this link and share it on your social media, WhatsApp status, or anywhere your customers can find you.
            </p>
          </div>
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-sm font-medium text-[#1a1a1a] hover:border-[#1a1a1a] transition-all shrink-0 ml-3"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`bg-white border border-[#e5e5e5] rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow ${
              index === 0 ? "col-span-2 lg:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  stat.up ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.up ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
            <p className="text-[#888888] text-xs sm:text-sm mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-[#e5e5e5] rounded-2xl hover:border-[#1a1a1a] transition-all active:scale-[0.98]"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-[#1a1a1a] text-sm sm:text-base group-hover:text-[#1a1a1a]">
                  {action.title}
                </h3>
                <p className="text-[#888888] text-xs sm:text-sm mt-0.5">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-[#1a1a1a]">Recent orders</h2>
          <Link
            href={`/dashboard/${storeSlug}/orders`}
            className="text-sm text-[#1a1a1a] hover:text-[#666666] transition-colors flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-[#888888]">
              <ShoppingCart className="w-8 h-8 mx-auto mb-3 text-[#cccccc]" />
              <p>No orders yet</p>
              <p className="text-sm mt-1">Orders will appear here once customers start buying</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Order ID
                    </th>
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Customer
                    </th>
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#1a1a1a]">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666666]">
                        {order.customer_name || order.customer_email || "Guest"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666666]">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            order.status === "paid"
                              ? "bg-green-50 text-green-700"
                              : order.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : order.status === "shipped"
                              ? "bg-indigo-50 text-indigo-700"
                              : order.status === "delivered"
                              ? "bg-blue-50 text-blue-700"
                              : order.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#1a1a1a] text-right">
                        ₹{order.total_amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Order Cards */}
        <div className="lg:hidden space-y-3">
          {recentOrders.length === 0 ? (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 text-center text-[#888888]">
              <ShoppingCart className="w-8 h-8 mx-auto mb-3 text-[#cccccc]" />
              <p>No orders yet</p>
              <p className="text-sm mt-1">Orders will appear here once customers start buying</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-[#e5e5e5] rounded-2xl p-4 active:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === "paid"
                        ? "bg-green-50 text-green-700"
                        : order.status === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : order.status === "shipped"
                        ? "bg-indigo-50 text-indigo-700"
                        : order.status === "delivered"
                        ? "bg-blue-50 text-blue-700"
                        : order.status === "cancelled"
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Pending"}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#888888]">Customer</span>
                    <span className="text-sm text-[#1a1a1a] font-medium">
                      {order.customer_name || order.customer_email || "Guest"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#888888]">Date</span>
                    <span className="text-sm text-[#666666]">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#f5f5f5]">
                    <span className="text-xs text-[#888888]">Amount</span>
                    <span className="text-base font-bold text-[#1a1a1a]">
                      ₹{order.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}