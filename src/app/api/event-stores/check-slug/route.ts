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

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug?.trim()) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Check event_stores table (NOT stores table)
    const { data: eventStoreExists } = await supabase
      .from("event_stores")
      .select("id")
      .eq("slug", slug.trim())
      .single();

    // Also check stores table to prevent collision with online stores
    const { data: storeExists } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug.trim())
      .single();

    const available = !eventStoreExists && !storeExists;

    return NextResponse.json({ available });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}