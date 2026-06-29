import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrf, csrfErrorResponse } from "@/lib/csrf";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";

// ====== ZOD SCHEMAS ======

const StoreIdParamSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
});

const OrderItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  product_name: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
  variant_name: z.string().max(200).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  shipping_fee: z.number().nonnegative().default(0),
  additional_fee: z.number().nonnegative().default(0),
  platform_fee: z.number().nonnegative().default(0),
  gst_amount: z.number().nonnegative().default(0),
  custom_fields: z.record(z.string(), z.any()).optional().nullable(),
});

const CreateOrderSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email("Invalid email").max(200),
  customer_phone: z.string().max(20).optional().nullable(),
  customer_address: z.string().max(2000).optional().nullable(),
  total_amount: z.number().nonnegative(),
  subtotal: z.number().nonnegative().default(0),
  shipping_fee: z.number().nonnegative().default(0),
  additional_fee: z.number().nonnegative().default(0),
  platform_fee: z.number().nonnegative().default(0),
  gst_amount: z.number().nonnegative().default(0),
  custom_fields_total: z.number().nonnegative().default(0),
  order_items: z.array(OrderItemSchema).min(1).max(100),
});

// ====== ENCRYPTION ======

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

function decrypt(encryptedText: string): string | null {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) return encryptedText;
  if (!encryptedText.includes(":")) return encryptedText;

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return null;
  }
}

// ====== SUPABASE CLIENT ======

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

// ====== ANALYTICS ======

async function updateAnalytics(supabase: any, storeId: string, orderAmount: number) {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("analytics")
    .select("id, orders, revenue")
    .eq("store_id", storeId)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("analytics")
      .update({
        orders: (existing.orders || 0) + 1,
        revenue: (existing.revenue || 0) + orderAmount,
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("analytics")
      .insert({
        store_id: storeId,
        date: today,
        page_views: 0,
        orders: 1,
        revenue: orderAmount,
      });
  }
}

// ====== GET — Fetch orders ======

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify store ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("id", store_id)
    .single();

  if (!store || store.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("store_id", store_id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders || [] });
}

// ====== POST — Create order ======

export async function POST(request: NextRequest) {

  if (!validateCsrf(request)) {
  return csrfErrorResponse();
}

  const supabase = await getSupabase();

  // Parse and validate body
  let body: z.infer<typeof CreateOrderSchema>;
  try {
    const rawBody = await request.json();
    body = CreateOrderSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    // 1. Get store
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("id", body.store_id)
      .maybeSingle();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Get payment settings
    const { data: paymentSettings } = await supabase
      .from("payment_settings")
      .select("razorpay_key_id, razorpay_key_secret, currency, test_mode, is_connected")
      .eq("store_id", store.id)
      .maybeSingle();

    if (!paymentSettings?.razorpay_key_id || !paymentSettings.razorpay_key_secret) {
      return NextResponse.json(
        { error: "Razorpay not configured for this store" },
        { status: 400 }
      );
    }

    // 3. Decrypt the secret
    const decryptedSecret = decrypt(paymentSettings.razorpay_key_secret);
    if (!decryptedSecret) {
      return NextResponse.json(
        { error: "Failed to decrypt payment secret" },
        { status: 500 }
      );
    }

    // 4. Create Razorpay Order with decrypted secret
    const razorpay = new Razorpay({
      key_id: paymentSettings.razorpay_key_id,
      key_secret: decryptedSecret,
    });

    const amountInPaise = Math.round(body.total_amount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: paymentSettings.currency || "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        store_name: store.name,
        customer_email: body.customer_email,
      },
    });

    // 5. Insert order into DB with validated fields
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: body.store_id,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_address: body.customer_address,
        total_amount: body.total_amount,
        subtotal: body.subtotal,
        shipping_fee: body.shipping_fee,
        additional_fee: body.additional_fee,
        platform_fee: body.platform_fee,
        gst_amount: body.gst_amount,
        custom_fields_total: body.custom_fields_total,
        payment_status: "pending",
        status: "pending",
        razorpay_order_id: razorpayOrder.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 6. Insert order items from validated array
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(
        body.order_items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          variant_name: item.variant_name,
          sku: item.sku,
          shipping_fee: item.shipping_fee,
          additional_fee: item.additional_fee,
          platform_fee: item.platform_fee,
          gst_amount: item.gst_amount,
          custom_fields: item.custom_fields,
          created_at: new Date().toISOString(),
        }))
      );

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
    }

    // 7. Update analytics
    await updateAnalytics(supabase, body.store_id, body.total_amount);

    // 8. Return to frontend
    return NextResponse.json({
      order,
      razorpay_order_id: razorpayOrder.id,
      razorpay_key_id: paymentSettings.razorpay_key_id,
      amount: amountInPaise,
      currency: paymentSettings.currency || "INR",
    });

  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}