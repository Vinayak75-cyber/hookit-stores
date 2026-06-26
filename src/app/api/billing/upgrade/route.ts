import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { storeSlug, plan } = body;

  if (!storeSlug || !plan) {
    return NextResponse.json({ error: "Store slug and plan required" }, { status: 400 });
  }

  if (!["starter", "growth", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (plan === "pro") {
    return NextResponse.json({ error: "Pro plan coming soon" }, { status: 400 });
  }

  // Verify user owns this store
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id, subscription_plan")
    .eq("slug", storeSlug)
    .single();

  if (!store || store.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (store.subscription_plan === plan) {
    return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
  }

  // Update subscription plan
  const { error } = await supabase
    .from("stores")
    .update({ subscription_plan: plan })
    .eq("id", store.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Upgraded to ${plan} plan`,
  });
}