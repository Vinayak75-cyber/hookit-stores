import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "EVT-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
    const {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking } = await supabase
      .from("event_bookings")
      .select(
        `
        *,
        event_booking_items (*)
      `
      )
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ success: true, booking_id });
    }

    // Update booking as paid
    const { error: updateError } = await supabase
      .from("event_bookings")
      .update({
        payment_status: "paid",
        razorpay_payment_id,
        booking_status: "confirmed",
      })
      .eq("id", booking_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    // Update ticket quantities sold
    for (const item of booking.event_booking_items || []) {
      await supabase.rpc("increment_ticket_sold", {
        ticket_type_id: item.ticket_type_id,
        quantity: item.quantity,
      });
    }

    // Generate tickets
    const tickets = [];
    for (const item of booking.event_booking_items || []) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = generateTicketCode();
        
        const { data: ticket } = await supabase
          .from("event_tickets")
          .insert({
            booking_id: booking_id,
            event_id: booking.event_id,
            ticket_code: ticketCode,
            attendee_name: booking.customer_name,
            ticket_type_name: item.ticket_name,
            status: "active",
            checked_in: false,
          })
          .select()
          .single();

        if (ticket) {
          tickets.push(ticket);
        }
      }
    }

    // Create payout record
    await supabase.from("event_payouts").insert({
      event_id: booking.event_id,
      event_store_id: booking.event_store_id,
      gross_revenue: booking.total_amount,
      platform_commission: booking.platform_fee,
      payout_amount: booking.host_payout_amount,
      payout_status: "pending",
    });

    return NextResponse.json({
      success: true,
      booking_id,
      tickets,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: err.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}