import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// PATCH - Update ticket type
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketTypeId: string }> }
) {
  try {
    const { ticketTypeId } = await params;

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

    // Verify ownership via event
    const { data: ticketType } = await supabase
      .from("event_ticket_types")
      .select("id, event_id, events!inner(user_id)")
      .eq("id", ticketTypeId)
      .single();

    if (!ticketType) {
      return NextResponse.json(
        { error: "Ticket type not found" },
        { status: 404 }
      );
    }

    // @ts-ignore - nested join type
    if (ticketType.events?.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: Record<string, any> = {};
    const allowedFields = [
      "name",
      "description",
      "price",
      "quantity_total",
      "max_per_booking",
      "sale_start",
      "sale_end",
      "is_active",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from("event_ticket_types")
      .update(updateData)
      .eq("id", ticketTypeId)
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

// DELETE - Delete ticket type
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ticketTypeId: string }> }
) {
  try {
    const { ticketTypeId } = await params;

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

    // Verify ownership via event
    const { data: ticketType } = await supabase
      .from("event_ticket_types")
      .select("id, event_id, events!inner(user_id)")
      .eq("id", ticketTypeId)
      .single();

    if (!ticketType) {
      return NextResponse.json(
        { error: "Ticket type not found" },
        { status: 404 }
      );
    }

    // @ts-ignore - nested join type
    if (ticketType.events?.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { error } = await supabase
      .from("event_ticket_types")
      .delete()
      .eq("id", ticketTypeId);

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