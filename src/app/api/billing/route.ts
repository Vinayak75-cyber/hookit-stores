import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeSlug = searchParams.get("storeSlug");

  if (!storeSlug) {
    return NextResponse.json({ error: "Store slug required" }, { status: 400 });
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
    .select("id, subscription_plan, is_active")
    .eq("slug", storeSlug)
    .eq("user_id", user.id)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Get current month's bill
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthStr = currentMonthStart.toISOString().split("T")[0];

  const { data: currentBill } = await supabase
  .from("monthly_bills")
  .select("*")
  .eq("store_id", store.id)
  .in("status", ["pending", "overdue"])
  .order("bill_month", { ascending: false })
  .limit(1)
  .single();

  // Get previous month's bill
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonthStart.toISOString().split("T")[0];

  const { data: previousBill } = await supabase
    .from("monthly_bills")
    .select("*")
    .eq("store_id", store.id)
    .eq("bill_month", prevMonthStr)
    .single();

  // Get all bills history
  const { data: billHistory } = await supabase
    .from("monthly_bills")
    .select("*")
    .eq("store_id", store.id)
    .order("bill_month", { ascending: false });

    return NextResponse.json({
    store: {
      subscription_plan: store.subscription_plan,
      is_active: store.is_active,
    },
    currentBill: currentBill || null,
    billHistory: billHistory || [],
  });
}