import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("store_id");

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

  if (!storeId) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const body = await request.json();

  try {
    // 1. Get store and payment settings
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("id", body.store_id)
      .maybeSingle();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

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

    // 2. Create Razorpay Order
    const razorpay = new Razorpay({
      key_id: paymentSettings.razorpay_key_id,
      key_secret: paymentSettings.razorpay_key_secret,
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

    // 3. Insert order into DB with razorpay_order_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: body.store_id,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_address: body.customer_address,
        total_amount: body.total_amount,
        subtotal: body.subtotal || 0,
        shipping_fee: body.shipping_fee || 0,
        additional_fee: body.additional_fee || 0,
        platform_fee: body.platform_fee || 0,
        gst_amount: body.gst_amount || 0,
        custom_fields_total: body.custom_fields_total || 0,
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

    // 4. Insert order items
    if (body.order_items && body.order_items.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          body.order_items.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            variant_name: item.variant_name || null,
            sku: item.sku || null,
            shipping_fee: item.shipping_fee || 0,
            additional_fee: item.additional_fee || 0,
            platform_fee: item.platform_fee || 0,
            gst_amount: item.gst_amount || 0,
            custom_fields: item.custom_fields || null,
            created_at: new Date().toISOString(),
          }))
        );
      
      if (itemsError) {
        console.error("Order items insert error:", itemsError);
      }
    }

    // 5. Update analytics
    await updateAnalytics(supabase, body.store_id, body.total_amount || 0);

    // 6. Return order + Razorpay order_id to frontend
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