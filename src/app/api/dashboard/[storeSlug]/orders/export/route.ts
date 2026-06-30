import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const { storeSlug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing date range parameters" },
      { status: 400 }
    );
  }

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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get store
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", storeSlug)
    .eq("user_id", user.id)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Calculate inclusive date range (from midnight to end of day)
  // Add 1 day to 'to' for exclusive upper bound to include the full 'to' day
  const toDate = new Date(to);
  toDate.setDate(toDate.getDate() + 1);
  const toExclusive = toDate.toISOString().split("T")[0];

  // Fetch orders within date range
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        id,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq("store_id", store.id)
    .gte("created_at", from)
    .lt("created_at", toExclusive)
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Export orders error:", ordersError);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }

  // Calculate totals
  const totalSales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalItems = orders?.reduce(
    (sum, o) => sum + (o.order_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0),
    0
  ) || 0;

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  orders?.forEach((o) => {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  });

  return NextResponse.json({
    store,
    orders: orders || [],
    summary: {
      totalSales,
      totalOrders,
      totalItems,
      from,
      to,
      statusBreakdown,
    },
  });
}