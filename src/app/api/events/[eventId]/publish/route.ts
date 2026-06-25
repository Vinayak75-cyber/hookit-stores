import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

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
    const { is_published } = body;

    if (typeof is_published !== "boolean") {
      return NextResponse.json(
        { error: "is_published boolean is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("events")
      .select("id, user_id, title, event_store_id")
      .eq("id", eventId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If publishing, validate required fields
    if (is_published === true) {
      const { data: eventWithRelations } = await supabase
        .from("events")
        .select(
          `
          title,
          event_date,
          venue_name,
          event_posters (id),
          event_ticket_types (id)
        `
        )
        .eq("id", eventId)
        .single();

      if (!eventWithRelations) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      const missing: string[] = [];
      if (!eventWithRelations.title) missing.push("Event title");
      if (!eventWithRelations.event_date) missing.push("Event date");
      if (!eventWithRelations.venue_name) missing.push("Venue");
      if (!eventWithRelations.event_posters?.length) missing.push("Poster");
      if (!eventWithRelations.event_ticket_types?.length)
        missing.push("At least one ticket type");

      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: "Cannot publish: missing required fields",
            missing,
          },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("events")
      .update({ is_published })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: is_published ? "Event published" : "Event unpublished",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}