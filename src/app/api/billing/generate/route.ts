import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.BILLING_SECRET_KEY || "hookit-billing-2026";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const monthParam = searchParams.get("month");

  if (secret !== SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let billMonth: Date;
  let billMonthEnd: Date;
  let dueDate: Date;

  if (monthParam === "current") {
    billMonth = new Date(currentYear, currentMonth, 1);
    billMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    dueDate = new Date(currentYear, currentMonth + 1, 5);
  } else {
    billMonth = new Date(currentYear, currentMonth - 1, 1);
    billMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    dueDate = new Date(currentYear, currentMonth, 5);
  }

  const billMonthStr = `${billMonth.getFullYear()}-${String(billMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-05`;

  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, subscription_plan")
    .eq("is_active", true);

  if (storesError) {
    return NextResponse.json({ error: storesError.message }, { status: 500 });
  }

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const store of stores || []) {
    const { data: existing } = await supabase
      .from("monthly_bills")
      .select("id")
      .eq("store_id", store.id)
      .eq("bill_month", billMonthStr)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    let totalCommission = 0;
    let totalOrdersCount = 0;
    let subscriptionAmount = 0;
    let totalAmount = 0;

    if (store.subscription_plan === "starter") {
      // Bill ALL non-cancelled, non-refunded orders — not just "paid" ones
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
.select("subtotal, gst_amount")
.eq("store_id", store.id)
.neq("status", "cancelled")
.neq("status", "refunded")
.gt("subtotal", 0)  // Exclude orders with 0 subtotal
.gte("created_at", billMonth.toISOString())
.lte("created_at", billMonthEnd.toISOString());

      if (ordersError) {
        errors.push(`Store ${store.id}: ${ordersError.message}`);
        continue;
      }

      for (const order of orders || []) {
        const commissionable = (order.subtotal || 0) + (order.gst_amount || 0);
        totalCommission += commissionable * 0.03;
        totalOrdersCount++;
      }

      totalAmount = Math.round(totalCommission * 100) / 100;
    } else if (store.subscription_plan === "growth") {
      subscriptionAmount = 999;
      totalAmount = 999;
    } else if (store.subscription_plan === "pro") {
      skipped++;
      continue;
    }

    const status = totalAmount === 0 ? "waived" : "pending";

    const { error: insertError } = await supabase.from("monthly_bills").insert({
      store_id: store.id,
      bill_month: billMonthStr,
      plan_type: store.subscription_plan,
      total_commission: Math.round(totalCommission * 100) / 100,
      total_orders_count: totalOrdersCount,
      subscription_amount: subscriptionAmount,
      total_amount: totalAmount,
      status: status,
      due_date: dueDateStr,
    });

    if (insertError) {
      errors.push(`Store ${store.id}: ${insertError.message}`);
    } else {
      generated++;
    }
  }

  const monthLabel = billMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return NextResponse.json({
    success: true,
    message: `Bills generated for ${monthLabel}`,
    generated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}