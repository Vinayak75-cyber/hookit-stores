import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateCsrf, csrfErrorResponse } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ====== ZOD SCHEMAS ======

const StoreIdParamSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
});

const CreateCollectionSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  handle: z.string()
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens")
    .optional()
    .nullable(),
  image_url: z.string().url("Invalid image URL").max(500).optional().nullable(),
});

// ====== GET ======

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawStoreId = searchParams.get("store_id");

  // Validate store_id parameter
  const paramValidation = StoreIdParamSchema.safeParse({ store_id: rawStoreId });
  if (!paramValidation.success) {
    return NextResponse.json(
      { error: "Invalid store_id", details: paramValidation.error.issues },
      { status: 400 }
    );
  }

  const { store_id } = paramValidation.data;

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

    // 🔒 AUTH: Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔒 AUTHORIZATION: Verify user owns the store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("user_id")
    .eq("id", store_id)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: collections, error } = await supabase
    .from("collections")
    .select("*")
    .eq("store_id", store_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ collections: collections || [] });
}

// ====== POST ======

export async function POST(request: NextRequest) {

  if (!validateCsrf(request)) {
  return csrfErrorResponse();
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

  // Parse and validate body
  let body: z.infer<typeof CreateCollectionSchema>;
  try {
    const rawBody = await request.json();
    body = CreateCollectionSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify store ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("id", body.store_id)
    .single();

  if (!store || store.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Generate handle from name if not provided
  const handle = body.handle || body.name.toLowerCase().replace(/\s+/g, "-");

  // Insert with ONLY validated fields
  const { data: collection, error } = await supabase
    .from("collections")
    .insert({
      store_id: body.store_id,
      name: body.name,
      description: body.description,
      handle: handle,
      image_url: body.image_url,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ collection });
}