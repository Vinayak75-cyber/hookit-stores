import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { storeSlug } = await request.json();

    if (!storeSlug) {
      return NextResponse.json({ error: "storeSlug is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      }
    );

    // Look up store by slug
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = store.id;
    const today = new Date().toISOString().split("T")[0];

    // Try to update existing row for today
    const { data: existing, error: fetchError } = await supabase
      .from("analytics")
      .select("id, page_views")
      .eq("store_id", storeId)
      .eq("date", today)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Analytics fetch error:", fetchError);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("analytics")
        .update({ page_views: (existing.page_views || 0) + 1 })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Analytics update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from("analytics")
        .insert({
          store_id: storeId,
          date: today,
          page_views: 1,
          orders: 0,
          revenue: 0,
        });

      if (insertError) {
        console.error("Analytics insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}