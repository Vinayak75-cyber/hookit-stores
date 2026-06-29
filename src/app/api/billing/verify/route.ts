import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

// ====== ZOD SCHEMAS ======

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1).max(200),
  razorpay_payment_id: z.string().min(1).max(200),
  razorpay_signature: z.string().min(1).max(500),
});

// ====== RATE LIMITING ======

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "15 m"),
  analytics: true,
  prefix: "ratelimit:billing",
});

function getIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim()
    || realIP
    || "127.0.0.1";
}

// ====== POST ======

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getIP(request);
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
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

  // Parse and validate body
  let body: z.infer<typeof VerifyPaymentSchema>;
  try {
    const rawBody = await request.json();
    body = VerifyPaymentSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== body.razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 🔒 AUTHORIZATION: Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the bill
  const { data: bill } = await supabase
    .from("monthly_bills")
    .select("id, store_id")
    .eq("razorpay_order_id", body.razorpay_order_id)
    .single();

    if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  // 🔒 AUTHORIZATION: Verify user owns the store associated with this bill
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("user_id")
    .eq("id", bill.store_id)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();

  // Update bill as paid
  await supabase
    .from("monthly_bills")
    .update({
      status: "paid",
      paid_at: now,
      razorpay_payment_id: body.razorpay_payment_id,
    })
    .eq("id", bill.id);

  // Update payment record
  await supabase
    .from("bill_payments")
    .update({
      status: "captured",
      paid_at: now,
      razorpay_payment_id: body.razorpay_payment_id,
    })
    .eq("razorpay_order_id", body.razorpay_order_id);

  // Ensure store is active (in case it was deactivated)
  await supabase
    .from("stores")
    .update({ is_active: true })
    .eq("id", bill.store_id);

  // Add rate limit headers to successful response
  const response = NextResponse.json({
    success: true,
    message: "Payment verified successfully",
  });

  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());

  return response;
}