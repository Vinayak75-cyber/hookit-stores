import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const body = await req.json();
    const { booking_id, amount } = body;

    if (!booking_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Booking ID and valid amount are required" },
        { status: 400 }
      );
    }

    // Verify booking exists and is pending
    const { data: booking } = await supabase
      .from("event_bookings")
      .select("id, payment_status, total_amount")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.payment_status !== "pending") {
      return NextResponse.json(
        { error: "Booking is already paid or cancelled" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `evt_${booking_id}`,
      notes: {
        booking_id: booking_id,
        type: "event_ticket",
      },
    });

    // Update booking with Razorpay order ID
    await supabase
      .from("event_bookings")
      .update({ razorpay_order_id: order.id })
      .eq("id", booking_id);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error("Razorpay order creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}