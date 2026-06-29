import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { validateCsrf, csrfErrorResponse } from "@/lib/csrf";
import { Redis } from "@upstash/redis";

// ====== ZOD SCHEMAS ======

const CreateStoreSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

// ====== RATE LIMITING ======

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:stores",
});

function getIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim()
    || realIP
    || "127.0.0.1";
}

// ====== GET ======

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

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

  if (slug) {
    // Validate slug format
    const slugValidation = z.string()
      .max(50)
      .regex(/^[a-z0-9-]+$/)
      .safeParse(slug);

    if (!slugValidation.success) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("*, store_settings(*), theme_settings(*), social_links(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    return NextResponse.json({ store });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ stores: stores || [] });
}

// ====== POST ======

export async function POST(request: NextRequest) {

  if (!validateCsrf(request)) {
  return csrfErrorResponse();
}

  // Rate limiting
  const ip = getIP(request);
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
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

  // Store limit check
  const { count: storeCount, error: countError } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (countError) {
    console.error("Error counting stores:", countError);
    return NextResponse.json(
      { error: "Failed to check store limit" },
      { status: 500 }
    );
  }

  const maxStores = 2;
  if (storeCount && storeCount >= maxStores) {
    return NextResponse.json(
      { error: "Store limit reached. Upgrade to Pro to create more stores." },
      { status: 403 }
    );
  }

  // Parse and validate body
  let body: z.infer<typeof CreateStoreSchema>;
  try {
    const rawBody = await request.json();
    body = CreateStoreSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Insert with ONLY validated fields
  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      user_id: user.id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      category: body.category,
      is_active: true,
      subscription_plan: "starter",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ store });
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());

  return response;
}