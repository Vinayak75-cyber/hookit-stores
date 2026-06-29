import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateCsrf, csrfErrorResponse } from "@/lib/csrf";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {

  if (!validateCsrf(request)) {
  return csrfErrorResponse();
}

  const { storeSlug } = await params;
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
    cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: Record<string, unknown> }) =>
      cookieStore.set(name, value, options)
    );
  } catch {}
}
      },
    }
  );

  // Verify user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get store and verify ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("slug", storeSlug)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete store (cascading will handle related data if set up in DB)
  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", store.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}