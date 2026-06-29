import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrf, csrfErrorResponse } from "@/lib/csrf";
import { fetchWithCsrf } from "@/hooks/use-csrf";
import { z } from "zod";

// ====== ZOD SCHEMAS ======

const ProductImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
});

const ProductVariantSchema = z.object({
  variant_name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  compare_price: z.number().nonnegative().optional().nullable(),
  quantity: z.number().int().nonnegative().optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

const VariantOptionSchema = z.object({
  option_name: z.string().min(1).max(100),
  option_values: z.array(z.string()).min(1),
});

const ProductSpecificationSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
});

const ProductCustomFieldSchema = z.object({
  label: z.string().min(1).max(200),
  field_type: z.enum(["text", "textarea", "file", "checkbox"]),
  is_required: z.boolean().default(false),
  char_limit: z.number().int().positive().optional().nullable(),
  additional_price: z.number().nonnegative().default(0),
});

const CreateProductSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  cost_price: z.number().nonnegative().optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  gst_mode: z.enum(["included", "excluded"]).optional().nullable(),
  gst_percentage: z.number().min(0).max(100).optional().nullable(),
  shipping_fee: z.number().nonnegative().default(0),
  additional_fee: z.number().nonnegative().default(0),
  platform_fee: z.number().nonnegative().default(0),
  platform_fee_type: z.enum(["fixed", "percentage"]).optional().nullable(),
  track_inventory: z.boolean().default(false),
  stock: z.number().int().nonnegative().optional().nullable(),
  low_stock_alert: z.number().int().positive().optional().nullable(),
  continue_selling: z.boolean().default(false),
  is_digital: z.boolean().default(false),
  digital_file_url: z.string().url().optional().nullable(),
  digital_download_limit: z.number().int().positive().optional().nullable(),
  min_quantity: z.number().int().positive().default(1),
  max_quantity: z.number().int().positive().optional().nullable(),
  visibility: z.enum(["active", "draft", "archived"]).default("draft"),
  meta_title: z.string().max(200).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  url_slug: z.string().max(200).optional().nullable(),
  weight: z.number().nonnegative().optional().nullable(),
  length: z.number().nonnegative().optional().nullable(),
  width: z.number().nonnegative().optional().nullable(),
  height: z.number().nonnegative().optional().nullable(),
  images: z.array(z.string().url()).max(20).default([]),
  variants: z.array(ProductVariantSchema).max(50).default([]),
  variant_options: z.array(VariantOptionSchema).max(10).default([]),
  specifications: z.array(ProductSpecificationSchema).max(50).default([]),
  custom_fields: z.array(ProductCustomFieldSchema).max(20).default([]),
  collection_ids: z.array(z.string().uuid()).max(50).default([]),
});

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

    // 🔒 AUTH: Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("slug", storeSlug)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // 🔒 AUTHORIZATION: Verify user owns the store
  if (store.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  // 🔒 CSRF VALIDATION
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

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate body
  let body: z.infer<typeof CreateProductSchema>;
  try {
    const rawBody = await request.json();
    body = CreateProductSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 3. Verify store ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("id", body.store_id)
    .single();

  if (!store || store.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 4. Build clean insert data — ONLY validated fields
  const urlSlug = body.url_slug || body.name.toLowerCase().replace(/\s+/g, "-");

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
      url_slug: urlSlug,
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

  // 5. Insert related data using validated arrays
  if (body.images.length > 0) {
    const imageRecords = body.images.map((url, index) => ({
      product_id: product.id,
      image_url: url,
      sort_order: index,
    }));
    await supabase.from("product_images").insert(imageRecords);
  }

  if (body.variants.length > 0) {
    const variantRecords = body.variants.map((v) => ({
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

  if (body.variant_options.length > 0) {
    const optionRecords = body.variant_options.map((o) => ({
      product_id: product.id,
      option_name: o.option_name,
      option_values: o.option_values,
    }));
    await supabase.from("variant_options").insert(optionRecords);
  }

  if (body.specifications.length > 0) {
    const specRecords = body.specifications.map((s) => ({
      product_id: product.id,
      key: s.key,
      value: s.value,
    }));
    await supabase.from("product_specifications").insert(specRecords);
  }

  if (body.custom_fields.length > 0) {
    const fieldRecords = body.custom_fields.map((f) => ({
      product_id: product.id,
      label: f.label,
      field_type: f.field_type,
      is_required: f.is_required,
      char_limit: f.char_limit,
      additional_price: f.additional_price,
    }));
    await supabase.from("product_custom_fields").insert(fieldRecords);
  }

  if (body.collection_ids.length > 0) {
    const linkRecords = body.collection_ids.map((id) => ({
      product_id: product.id,
      collection_id: id,
    }));
    await supabase.from("collection_products").insert(linkRecords);
  }

  return NextResponse.json({ product });
}