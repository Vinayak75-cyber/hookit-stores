import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

    // Validate required fields
    if (
      !body.event_id ||
      !body.customer_name?.trim() ||
      !body.customer_phone?.trim() ||
      !body.items?.length
    ) {
      return NextResponse.json(
        { error: "Event ID, customer name, phone, and tickets are required" },
        { status: 400 }
      );
    }

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("id, event_store_id, is_published")
      .eq("id", body.event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_published) {
      return NextResponse.json(
        { error: "Event is not published" },
        { status: 400 }
      );
    }

    // Validate ticket types and availability
    for (const item of body.items) {
      const { data: ticketType } = await supabase
        .from("event_ticket_types")
        .select("quantity_total, quantity_sold, is_active")
        .eq("id", item.ticket_type_id)
        .single();

      if (!ticketType) {
        return NextResponse.json(
          { error: `Ticket type not found: ${item.ticket_name}` },
          { status: 400 }
        );
      }

      if (!ticketType.is_active) {
        return NextResponse.json(
          { error: `Ticket type is not active: ${item.ticket_name}` },
          { status: 400 }
        );
      }

      const available = ticketType.quantity_total - ticketType.quantity_sold;
      if (item.quantity > available) {
        return NextResponse.json(
          {
            error: `Not enough tickets available for ${item.ticket_name}. Only ${available} left.`,
          },
          { status: 400 }
        );
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("event_bookings")
      .insert({
        event_id: body.event_id,
        event_store_id: event.event_store_id,
        customer_name: body.customer_name.trim(),
        customer_email: body.customer_email?.trim() || null,
        customer_phone: body.customer_phone.trim(),
        total_amount: body.total_amount,
        platform_fee: body.platform_fee,
        host_payout_amount: body.host_payout_amount,
        payment_status: "pending",
        booking_status: "pending",
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    // Create booking items
    const bookingItems = body.items.map((item: any) => ({
      booking_id: booking.id,
      ticket_type_id: item.ticket_type_id,
      ticket_name: item.ticket_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from("event_booking_items")
      .insert(bookingItems);

    if (itemsError) {
      // Rollback - delete booking
      await supabase.from("event_bookings").delete().eq("id", booking.id);
      return NextResponse.json(
        { error: "Failed to create booking items" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { booking, items: bookingItems } }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List bookings for host
export async function GET(req: NextRequest) {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("event_id");

    let query = supabase
      .from("event_bookings")
      .select(
        `
        *,
        event_booking_items (*),
        events (title, slug)
      `
      )
      .eq("events.user_id", user.id);

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}