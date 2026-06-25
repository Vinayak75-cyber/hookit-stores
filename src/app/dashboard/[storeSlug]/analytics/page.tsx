import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  TrendingUp,
  Eye,
  ShoppingCart,
  DollarSign,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

async function getAnalyticsData(storeSlug: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
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

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get analytics data (page views)
  const { data: analytics } = await supabase
    .from("analytics")
    .select("*")
    .eq("store_id", store.id)
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Get ALL orders in last 30 days
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, total_amount, customer_email, created_at, payment_status")
    .eq("store_id", store.id)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  // Calculate totals — count ALL orders for revenue (matches overview page)
  const totalViews = analytics?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;
  const totalOrders = allOrders?.length || 0;
  const totalRevenue = (allOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const uniqueCustomers = new Set(allOrders?.map((o) => o.customer_email)).size || 0;

  // Build daily data from analytics table
  let dailyData = analytics?.map((a) => ({
    date: a.date,
    views: a.page_views || 0,
    orders: a.orders || 0,
    revenue: a.revenue || 0,
  })) || [];

  // If no analytics data, build from ALL orders
  if (dailyData.length === 0 && allOrders && allOrders.length > 0) {
    const orderByDate: Record<string, { views: number; orders: number; revenue: number }> = {};
    
    allOrders.forEach((order) => {
      const date = order.created_at.split("T")[0];
      if (!orderByDate[date]) {
        orderByDate[date] = { views: 0, orders: 0, revenue: 0 };
      }
      orderByDate[date].orders += 1;
      orderByDate[date].revenue += order.total_amount || 0;
    });

    dailyData = Object.entries(orderByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Top products by ALL orders
  const orderIds = (allOrders || []).map((o) => o.id);
  let topProducts: { name: string; quantity: number; revenue: number }[] = [];

  if (orderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, total_price")
      .in("order_id", orderIds);

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orderItems?.forEach((item) => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity || 0;
      productSales[item.product_name].revenue += item.total_price || 0;
    });

    topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  return {
    store,
    stats: { totalViews, totalOrders, totalRevenue, uniqueCustomers },
    dailyData,
    topProducts,
  };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const data = await getAnalyticsData(storeSlug);

  if (!data) {
    redirect("/login");
  }

  const { store, stats, dailyData, topProducts } = data;

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      change: "+12%",
      up: true,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      change: "+8%",
      up: true,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Page Views",
      value: stats.totalViews.toLocaleString("en-IN"),
      icon: Eye,
      change: "+24%",
      up: true,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Customers",
      value: stats.uniqueCustomers.toString(),
      icon: Users,
      change: "+15%",
      up: true,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Analytics</h1>
        <p className="text-[#888888] text-sm mt-1">
          Performance insights for {store.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${stat.up ? "text-green-600" : "text-red-600"}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
            <p className="text-[#888888] text-sm mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Revenue overview</h3>
            <p className="text-sm text-[#888888]">Last 30 days</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#888888]">
            <Calendar className="w-4 h-4" />
            Last 30 days
          </div>
        </div>

        {dailyData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-[#888888]">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-[#cccccc]" />
              <p>No data yet</p>
              <p className="text-sm mt-1">Analytics will appear once you start getting traffic and orders</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
  <div className="flex items-end gap-2 h-48 px-4">
    {dailyData.map((day, i) => {
      const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1);
      const height = Math.max((day.revenue / maxRevenue) * 100, 4);
      return (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-[40px]">
          <div className="text-xs font-medium text-[#1a1a1a] mb-1">
            ₹{day.revenue.toLocaleString("en-IN")}
          </div>
          <div
            className="w-full max-w-[60px] bg-[#1a1a1a] rounded-t-lg transition-all hover:bg-[#333333] relative group mx-auto"
            style={{ height: `${height}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              ₹{day.revenue.toLocaleString("en-IN")}
            </div>
          </div>
          <span className="text-[10px] text-[#999999]">
            {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      );
    })}
  </div>
</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Daily views</h3>
          {dailyData.length === 0 ? (
            <div className="text-center py-8 text-[#888888]">
              <Eye className="w-8 h-8 mx-auto mb-3 text-[#cccccc]" />
              <p>No view data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyData.slice(-7).map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#999999] w-20">
                    {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a1a1a] rounded-full"
                      style={{
                        width: `${Math.min((day.views / Math.max(...dailyData.map((d) => d.views), 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#1a1a1a] w-10 text-right">
                    {day.views}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Conversion rate</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#f5f5f5]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-[#1a1a1a]"
                    strokeDasharray={`${stats.totalViews > 0 ? (stats.totalOrders / stats.totalViews) * 100 : 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#1a1a1a]">
                    {stats.totalViews > 0 ? ((stats.totalOrders / stats.totalViews) * 100).toFixed(1) : "0"}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#888888]">
                {stats.totalOrders} orders from {stats.totalViews} views
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}