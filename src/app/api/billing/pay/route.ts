import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

// ====== ZOD SCHEMAS ======

const PayBillSchema = z.object({
  billId: z.string().uuid("Invalid bill ID"),
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

// ====== RAZORPAY ======

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  let body: z.infer<typeof PayBillSchema>;
  try {
    const rawBody = await request.json();
    body = PayBillSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Get bill details
  const { data: bill, error: billError } = await supabase
    .from("monthly_bills")
    .select("*, stores!inner(user_id, name, slug)")
    .eq("id", body.billId)
    .single();

  if (billError || !bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  // Verify user owns this store
  if (bill.stores.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (bill.status === "paid" || bill.status === "waived") {
    return NextResponse.json({ error: "Bill already paid" }, { status: 400 });
  }

  // Convert amount to paise (Razorpay expects smallest currency unit)
  const amountInPaise = Math.round(bill.total_amount * 100);

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `bill_${body.billId.slice(0, 8)}`,
    notes: {
      bill_id: body.billId,
      store_id: bill.store_id,
      bill_month: bill.bill_month,
      plan_type: bill.plan_type,
    },
  });

  // Save order ID to bill
  await supabase
    .from("monthly_bills")
    .update({ razorpay_order_id: order.id })
    .eq("id", body.billId);

  // Create payment record
  await supabase.from("bill_payments").insert({
    bill_id: body.billId,
    amount: bill.total_amount,
    status: "created",
    razorpay_order_id: order.id,
  });

  // Add rate limit headers to successful response
  const response = NextResponse.json({
    success: true,
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID,
    storeName: bill.stores.name,
  });

  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());

  return response;
}