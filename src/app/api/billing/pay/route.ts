import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { billId } = body;

  if (!billId) {
    return NextResponse.json({ error: "Bill ID required" }, { status: 400 });
  }

  // Get bill details
  const { data: bill, error: billError } = await supabase
    .from("monthly_bills")
    .select("*, stores!inner(user_id, name, slug)")
    .eq("id", billId)
    .single();

  if (billError || !bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  // Verify user owns this store
  if (bill.stores.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (bill.status === "paid" || bill.status === "waived") {
    return NextResponse.json({ error: "Bill already paid" }, { status: 400 });
  }

  // Convert amount to paise (Razorpay expects smallest currency unit)
  const amountInPaise = Math.round(bill.total_amount * 100);

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `bill_${billId.slice(0, 8)}`,
    notes: {
      bill_id: billId,
      store_id: bill.store_id,
      bill_month: bill.bill_month,
      plan_type: bill.plan_type,
    },
  });

  // Save order ID to bill
  await supabase
    .from("monthly_bills")
    .update({ razorpay_order_id: order.id })
    .eq("id", billId);

  // Create payment record
  await supabase.from("bill_payments").insert({
    bill_id: billId,
    amount: bill.total_amount,
    status: "created",
    razorpay_order_id: order.id,
  });

  return NextResponse.json({
    success: true,
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID,
    storeName: bill.stores.name,
  });
}