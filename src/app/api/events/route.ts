import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// POST - Create new event
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.event_store_id || !body.title?.trim() || !body.slug?.trim()) {
      return NextResponse.json(
        { error: "Event store ID, title, and slug are required" },
        { status: 400 }
      );
    }

    // Verify user owns the event store
    const { data: store } = await supabase
      .from("event_stores")
      .select("id")
      .eq("id", body.event_store_id)
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json(
        { error: "Event store not found or access denied" },
        { status: 403 }
      );
    }

    // Check slug uniqueness within this event store
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("event_store_id", body.event_store_id)
      .eq("slug", body.slug.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An event with this slug already exists in this store" },
        { status: 409 }
      );
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        event_store_id: body.event_store_id,
        user_id: user.id,
        title: body.title.trim(),
        slug: body.slug.trim(),
        short_description: body.short_description?.trim() || null,
        description: body.description?.trim() || null,
        event_date: body.event_date || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        venue_name: body.venue_name?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        google_maps_url: body.google_maps_url?.trim() || null,
        contact_email: body.contact_email?.trim() || null,
        contact_phone: body.contact_phone?.trim() || null,
        refund_policy: body.refund_policy?.trim() || null,
        terms: body.terms?.trim() || null,
        instructions: body.instructions?.trim() || null,
        whatsapp_support: body.whatsapp_support?.trim() || null,
        age_restriction: body.age_restriction?.trim() || null,
        dress_code: body.dress_code?.trim() || null,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List events (with optional filters)
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

    const { searchParams } = new URL(req.url);
    const eventStoreId = searchParams.get("event_store_id");
    const eventStoreSlug = searchParams.get("event_store_slug");
    const published = searchParams.get("published");

    let query = supabase.from("events").select(`
        *,
        event_posters (*),
        event_ticket_types (*)
      `);

    // Filter by event store
    if (eventStoreId) {
      query = query.eq("event_store_id", eventStoreId);
    }

    if (eventStoreSlug) {
      // First get the event store id from slug
      const { data: store } = await supabase
        .from("event_stores")
        .select("id")
        .eq("slug", eventStoreSlug)
        .single();

      if (store) {
        query = query.eq("event_store_id", store.id);
      }
    }

    // Filter published status
    if (published === "true") {
      query = query.eq("is_published", true);
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