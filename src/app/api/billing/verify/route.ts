import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Find the bill
  const { data: bill } = await supabase
    .from("monthly_bills")
    .select("id, store_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Update bill as paid
  await supabase
    .from("monthly_bills")
    .update({
      status: "paid",
      paid_at: now,
      razorpay_payment_id: razorpay_payment_id,
    })
    .eq("id", bill.id);

  // Update payment record
  await supabase
    .from("bill_payments")
    .update({
      status: "captured",
      paid_at: now,
      razorpay_payment_id: razorpay_payment_id,
    })
    .eq("razorpay_order_id", razorpay_order_id);

  // Ensure store is active (in case it was deactivated)
  await supabase
    .from("stores")
    .update({ is_active: true })
    .eq("id", bill.store_id);

  return NextResponse.json({
    success: true,
    message: "Payment verified successfully",
  });
}