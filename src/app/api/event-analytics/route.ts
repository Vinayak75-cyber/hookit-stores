import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const eventStoreSlug = searchParams.get("event_store_slug");

    if (!eventStoreSlug) {
      return NextResponse.json(
        { error: "Event store slug is required" },
        { status: 400 }
      );
    }

    // Get event store
    const { data: eventStore } = await supabase
      .from("event_stores")
      .select("id")
      .eq("slug", eventStoreSlug)
      .eq("user_id", user.id)
      .single();

    if (!eventStore) {
      return NextResponse.json(
        { error: "Event store not found" },
        { status: 404 }
      );
    }

    // Get all events for this store
    const { data: events } = await supabase
      .from("events")
      .select("id, is_published")
      .eq("event_store_id", eventStore.id);

    const eventIds = events?.map((e) => e.id) || [];

    // Get total bookings
    const { data: bookings } = await supabase
      .from("event_bookings")
      .select("total_amount, payment_status")
      .eq("event_store_id", eventStore.id);

    // Get total tickets sold
    const { data: ticketTypes } = await supabase
      .from("event_ticket_types")
      .select("quantity_sold")
      .in("event_id", eventIds.length > 0 ? eventIds : ["00000000-0000-0000-0000-000000000000"]);

    const totalEvents = events?.length || 0;
    const publishedEvents = events?.filter((e) => e.is_published).length || 0;
    const totalBookings = bookings?.length || 0;
    const totalRevenue =
      bookings
        ?.filter((b) => b.payment_status === "paid")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const totalTicketsSold =
      ticketTypes?.reduce((sum, t) => sum + (t.quantity_sold || 0), 0) || 0;

    return NextResponse.json({
      data: {
        total_events: totalEvents,
        published_events: publishedEvents,
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        total_tickets_sold: totalTicketsSold,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}