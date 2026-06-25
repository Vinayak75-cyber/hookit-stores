import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeSlug = searchParams.get("store_slug");

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

  if (!storeSlug) {
    return NextResponse.json({ error: "store_slug required" }, { status: 400 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), product_specifications(*), product_custom_fields(*), collection_products(collection_id, collections(*))")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: products || [] });
}

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

  const body = await request.json();

  // Insert product with all new fields
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      store_id: body.store_id,
      name: body.name,
      description: body.description,
      category: body.category,
      brand: body.brand,
      video_url: body.video_url,
      price: body.price,
      compare_at_price: body.compare_at_price,
      cost_price: body.cost_price,
      sku: body.sku,
      gst_mode: body.gst_mode,
      gst_percentage: body.gst_percentage,
      shipping_fee: body.shipping_fee,
      additional_fee: body.additional_fee,
      platform_fee: body.platform_fee,
      platform_fee_type: body.platform_fee_type,
      track_inventory: body.track_inventory,
      stock: body.stock,
      low_stock_alert: body.low_stock_alert,
      continue_selling: body.continue_selling,
      is_digital: body.is_digital,
      digital_file_url: body.digital_file_url,
      digital_download_limit: body.digital_download_limit,
      min_quantity: body.min_quantity,
      max_quantity: body.max_quantity,
      visibility: body.visibility,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      url_slug: body.url_slug || body.name.toLowerCase().replace(/\s+/g, "-"),
      weight: body.weight,
      length: body.length,
      width: body.width,
      height: body.height,
      status: body.visibility === "active" ? "active" : "draft",
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Insert product images
  if (body.images && body.images.length > 0) {
    const imageRecords = body.images.map((url: string, index: number) => ({
      product_id: product.id,
      image_url: url,
      sort_order: index,
    }));
    await supabase.from("product_images").insert(imageRecords);
  }

  // Insert variants
  if (body.variants && body.variants.length > 0) {
    const variantRecords = body.variants.map((v: any) => ({
      product_id: product.id,
      variant_name: v.variant_name,
      price: v.price,
      compare_price: v.compare_price,
      quantity: v.quantity,
      sku: v.sku,
      image_url: v.image_url,
    }));
    await supabase.from("product_variants").insert(variantRecords);
  }

  // Insert variant options
  if (body.variant_options && body.variant_options.length > 0) {
    const optionRecords = body.variant_options.map((o: any) => ({
      product_id: product.id,
      option_name: o.option_name,
      option_values: o.option_values,
    }));
    await supabase.from("variant_options").insert(optionRecords);
  }

  // Insert specifications
  if (body.specifications && body.specifications.length > 0) {
    const specRecords = body.specifications.map((s: any) => ({
      product_id: product.id,
      key: s.key,
      value: s.value,
    }));
    await supabase.from("product_specifications").insert(specRecords);
  }

  // Insert custom fields
  if (body.custom_fields && body.custom_fields.length > 0) {
    const fieldRecords = body.custom_fields.map((f: any) => ({
      product_id: product.id,
      label: f.label,
      field_type: f.field_type,
      is_required: f.is_required,
      char_limit: f.char_limit,
      additional_price: f.additional_price,
    }));
    await supabase.from("product_custom_fields").insert(fieldRecords);
  }

  // Link collections
  if (body.collection_ids && body.collection_ids.length > 0) {
    const linkRecords = body.collection_ids.map((id: string) => ({
      product_id: product.id,
      collection_id: id,
    }));
    await supabase.from("collection_products").insert(linkRecords);
  }

  return NextResponse.json({ product });
}