import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Helper to get supabase client (reused)
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// POST — Save payment settings (dashboard)
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", body.store_id)
    .eq("user_id", user.id)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updateData: any = {
    store_id: body.store_id,
    razorpay_key_id: body.razorpay_key_id?.trim() || null,
    currency: body.currency || "INR",
    test_mode: body.test_mode ?? true,
    is_connected: !!body.razorpay_key_id,
    updated_at: new Date().toISOString(),
  };

  // Only update secret if it was changed (not masked)
  if (body.razorpay_key_secret && body.razorpay_key_secret !== "••••••••••••") {
    updateData.razorpay_key_secret = body.razorpay_key_secret.trim();
  }

  const { error } = await supabase
    .from("payment_settings")
    .upsert(updateData, { onConflict: "store_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET — Fetch payment settings for a store (used by checkout to get key_id)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeSlug = searchParams.get("store_slug");

  if (!storeSlug) {
    return NextResponse.json({ error: "store_slug required" }, { status: 400 });
  }

  const supabase = await getSupabase();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("razorpay_key_id, currency, test_mode, is_connected")
    .eq("store_id", store.id)
    .single();

  if (!settings || !settings.is_connected) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 400 });
  }

  // Return ONLY the public key_id, never the secret
  return NextResponse.json({
    razorpay_key_id: settings.razorpay_key_id,
    currency: settings.currency || "INR",
    test_mode: settings.test_mode,
  });
}