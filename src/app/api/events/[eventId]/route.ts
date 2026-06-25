import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET - Single event with posters and ticket types
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    const { eventId } = params;

    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_posters (*),
        event_ticket_types (*),
        event_stores (id, name, slug)
      `
      )
      .eq("id", eventId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update event
export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    const { eventId } = params;
    const body = await req.json();

    // Verify ownership
    const { data: existing } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", eventId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build update object (only allow certain fields)
    const updateData: Record<string, any> = {};
    const allowedFields = [
      "title",
      "slug",
      "short_description",
      "description",
      "event_date",
      "start_time",
      "end_time",
      "venue_name",
      "address",
      "city",
      "google_maps_url",
      "contact_email",
      "contact_phone",
      "refund_policy",
      "terms",
      "instructions",
      "whatsapp_support",
      "age_restriction",
      "dress_code",
      "is_published",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (typeof body[field] === "string") {
          updateData[field] = body[field].trim() || null;
        } else {
          updateData[field] = body[field];
        }
      }
    });

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

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

// DELETE - Delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    const { eventId } = params;

    // Verify ownership
    const { data: existing } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", eventId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete (cascades to posters, ticket types via FK constraints)
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}