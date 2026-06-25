import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  ShoppingBag, ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw,
  Check, Package, Star, Ruler, Weight, Tag, Layers, FileText,
  Globe, Hash, Percent, Box, Info,
} from "lucide-react";
import { CartIcon } from "@/components/storefront/cart-icon";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";

async function getProductData(storeSlug: string, productId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*, store_settings(*), theme_settings(*), social_links(*)")
    .eq("slug", storeSlug)
    .single();

  if (storeError) {
    console.error("[DEBUG] Store error:", storeError.message, "| slug:", storeSlug);
    return null;
  }
  if (!store) {
    console.error("[DEBUG] Store not found for slug:", storeSlug);
    return null;
  }
  console.log("[DEBUG] Store found:", store.id, store.name);

  // 2. Fetch product with basic fields first
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", store.id)
    .single();

  if (productError) {
    console.error("[DEBUG] Product error:", productError.message, "| id:", productId, "| store_id:", store.id);
    return null;
  }
  if (!product) {
    console.error("[DEBUG] Product not found:", productId);
    return null;
  }
  console.log("[DEBUG] Product found:", product.id, product.name);

  // 3. Fetch images separately
  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    console.error("[DEBUG] Images error:", imagesError.message);
  }
  console.log("[DEBUG] Images count:", images?.length || 0);

  // 4. Fetch variants
  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);
  console.log("[DEBUG] Variants count:", variants?.length || 0);

  // 5. Fetch specs
  const { data: specs } = await supabase
    .from("product_specifications")
    .select("*")
    .eq("product_id", productId);
  console.log("[DEBUG] Specs count:", specs?.length || 0);

  // 6. Fetch custom fields
  const { data: customFields } = await supabase
    .from("product_custom_fields")
    .select("*")
    .eq("product_id", productId);
  console.log("[DEBUG] Custom fields count:", customFields?.length || 0);

  // 7. Fetch collections
  const { data: productCollections } = await supabase
    .from("product_collections")
    .select("collection_id")
    .eq("product_id", productId);

  let collections: any[] = [];
  if (productCollections && productCollections.length > 0) {
    const colIds = productCollections.map((pc: any) => pc.collection_id);
    const { data: colData } = await supabase
      .from("collections")
      .select("*")
      .in("id", colIds);
    collections = colData || [];
  }
  console.log("[DEBUG] Collections count:", collections.length);

  // 8. Related products
  const { data: related } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", store.id)
    .neq("id", productId)
    .eq("category", product.category)
    .limit(4);
  console.log("[DEBUG] Related count:", related?.length || 0);

  return {
    store,
    product: {
      ...product,
      product_images: images || [],
      product_variants: variants || [],
      product_specifications: specs || [],
      product_custom_fields: customFields || [],
      collections,
      compare_price: product.compare_at_price,
      inventory_quantity: product.stock,
    },
    related: related || [],
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  // Resolve params
  let storeSlug: string;
  let productId: string;

  try {
    const resolved = await params;
    storeSlug = resolved.storeSlug;
    productId = resolved.productId;
    console.log("[DEBUG] Params resolved:", storeSlug, productId);
  } catch (err: any) {
    console.error("[DEBUG] Params resolution failed:", err.message);
    notFound();
    return null as any;
  }

  const data = await getProductData(storeSlug, productId);

  if (!data) {
    console.error("[DEBUG] getProductData returned null");
    notFound();
    return null as any;
  }

  const { store, product, related } = data;

  const theme = store.theme_settings?.[0] || {
    primary_color: "#1a1a1a",
    background_color: "#ffffff",
    text_color: "#1a1a1a",
    accent_color: "#c9a96e",
    font_family: "Inter",
    border_radius: "12px",
  };

  const images = product.product_images || [];
  const hasDiscount = (product.compare_at_price || product.compare_price) &&
    (product.compare_at_price || 0) > product.price;
  const comparePrice = product.compare_at_price || product.compare_price || 0;

  const shippingFee = product.shipping_fee || 0;
  const additionalFee = product.additional_fee || 0;
  let platformFee = product.platform_fee || 0;
  if (product.platform_fee_type === "percentage" && platformFee > 0) {
    platformFee = (product.price * platformFee) / 100;
  }
  const totalFees = shippingFee + additionalFee + platformFee;
  const finalPrice = product.price + totalFees;

  const isOutOfStock = product.track_inventory && (product.stock || 0) <= 0 && !product.continue_selling;
  const isLowStock = product.track_inventory && (product.stock || 0) > 0 && (product.stock || 0) <= (product.low_stock_alert || 5);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color, color: theme.text_color, fontFamily: theme.font_family }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e5e5e5]/50 backdrop-blur-md" style={{ backgroundColor: `${theme.background_color}ee` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to store
          </Link>
          <CartIcon storeSlug={storeSlug} theme={theme} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <ProductImageGallery 
            images={images} 
            productName={product.name} 
            borderRadius={theme.border_radius} 
          />

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {product.brand && <p className="text-xs text-[#999999] uppercase tracking-wider mb-1">{product.brand}</p>}
                  <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.text_color }}>{product.name}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors"><Heart className="w-5 h-5 text-[#666666]" /></button>
                  <button className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors"><Share2 className="w-5 h-5 text-[#666666]" /></button>
                </div>
              </div>

              {product.collections?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.collections.map((col: any) => (
                    <span key={col.id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f5f5] text-[#666666]">{col.name}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <span className="text-3xl font-bold" style={{ color: theme.text_color }}>₹{finalPrice.toLocaleString()}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-[#999999] line-through">₹{comparePrice.toLocaleString()}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: theme.accent_color }}>
                      Save ₹{(comparePrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>


              {product.gst_percentage > 0 && (
                <p className="text-xs text-[#999999] mt-1">
                  {product.gst_mode === "included" ? `Includes ${product.gst_percentage}% GST` : `+ ${product.gst_percentage}% GST will be added`}
                </p>
              )}

              {totalFees > 0 && (
                <div className="mt-2 p-3 rounded-xl bg-[#f8f8f8] text-xs text-[#666666] space-y-1">
                  <p className="font-medium text-[#1a1a1a]">Price breakdown:</p>
                  <div className="flex justify-between"><span>Base price</span><span>₹{product.price.toLocaleString()}</span></div>
                  {shippingFee > 0 && <div className="flex justify-between"><span>Shipping</span><span>₹{shippingFee.toLocaleString()}</span></div>}
                  {additionalFee > 0 && <div className="flex justify-between"><span>Additional fee</span><span>₹{additionalFee.toLocaleString()}</span></div>}
                  {platformFee > 0 && <div className="flex justify-between"><span>Platform fee</span><span>₹{platformFee.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-medium text-[#1a1a1a] border-t border-[#e5e5e5] pt-1"><span>Total</span><span>₹{finalPrice.toLocaleString()}</span></div>
                </div>
              )}

              <div className="mt-3">
                {isOutOfStock ? (
                  <span className="text-sm text-red-500 font-medium">Out of stock</span>
                ) : isLowStock ? (
                  <span className="text-sm text-amber-600 font-medium flex items-center gap-1"><Info className="w-3 h-3" />Only {product.stock} left — order soon</span>
                ) : product.track_inventory ? (
                  <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />In stock ({product.stock} available)</span>
                ) : (
                  <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Available</span>
                )}
                {product.continue_selling && <p className="text-xs text-[#999999] mt-1">Continues selling when out of stock</p>}
              </div>
            </div>

            {/* Variants */}
            {product.product_variants?.length > 0 && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2"><Layers className="w-4 h-4" />Select Variant</h3>
                <div className="space-y-3">
                  {product.product_variants.map((variant: any) => (
                    <div key={variant.id} className="flex items-center justify-between p-3 rounded-xl border border-[#e5e5e5] hover:border-[#1a1a1a] cursor-pointer transition-all">
                      <div>
                        <p className="text-sm font-medium" style={{ color: theme.text_color }}>{variant.variant_name}</p>
                        {variant.sku && <p className="text-xs text-[#999999]">SKU: {variant.sku}</p>}
                        {variant.quantity !== null && <p className="text-xs text-[#999999]">Qty: {variant.quantity}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: theme.text_color }}>₹{variant.price.toLocaleString()}</p>
                        {variant.compare_price && variant.compare_price > variant.price && <p className="text-xs text-[#999999] line-through">₹{variant.compare_price.toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {product.product_custom_fields?.length > 0 && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />Custom Options</h3>
                <div className="space-y-3">
                  {product.product_custom_fields.map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.text_color }}>
                        {field.label}{field.is_required && <span className="text-red-500 ml-0.5">*</span>}{field.additional_price > 0 && <span className="text-xs text-[#999999] ml-1">(+₹{field.additional_price})</span>}
                      </label>
                      {field.field_type === "textarea" ? (
                        <textarea placeholder={`Enter ${field.label.toLowerCase()}`} maxLength={field.char_limit || undefined} rows={3} className="w-full border border-[#e5e5e5] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-all resize-none" />
                      ) : field.field_type === "file" ? (
                        <input type="file" className="w-full border border-[#e5e5e5] rounded-xl py-2.5 px-3 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#1a1a1a] file:text-white" />
                      ) : field.field_type === "checkbox" ? (
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-[#1a1a1a]" /><span className="text-sm text-[#666666]">{field.label}</span></label>
                      ) : (
                        <input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} maxLength={field.char_limit || undefined} className="w-full border border-[#e5e5e5] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-all" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2"><Info className="w-4 h-4" />Description</h3>
                <p className="text-[#666666] leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            {product.product_specifications?.length > 0 && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2"><Box className="w-4 h-4" />Specifications</h3>
                <div className="divide-y divide-[#f0f0f0]">
                  {product.product_specifications.map((spec: any) => (
                    <div key={spec.id} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-[#999999]">{spec.spec_key}</span>
                      <span className="text-sm font-medium" style={{ color: theme.text_color }}>{spec.spec_value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping / Digital */}
            {(product.weight || product.length || product.width || product.height || product.is_digital) && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2"><Truck className="w-4 h-4" />{product.is_digital ? "Digital Product" : "Shipping & Dimensions"}</h3>
                {product.is_digital ? (
                  <div className="space-y-2">
                    <p className="text-sm text-[#666666] flex items-center gap-2"><Globe className="w-4 h-4 text-[#999999]" />Instant digital download</p>
                    {product.digital_download_limit > 0 && <p className="text-sm text-[#666666]">Download limit: {product.digital_download_limit} times</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {product.weight !== null && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f8f8]">
                        <Weight className="w-4 h-4 text-[#999999]" />
                        <div><p className="text-xs text-[#999999]">Weight</p><p className="text-sm font-medium">{product.weight} kg</p></div>
                      </div>
                    )}
                    {(product.length || product.width || product.height) && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f8f8]">
                        <Ruler className="w-4 h-4 text-[#999999]" />
                        <div><p className="text-xs text-[#999999]">Dimensions</p><p className="text-sm font-medium">{product.length || 0} × {product.width || 0} × {product.height || 0} cm</p></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SKU / Category / Brand */}
            <div className="border-t border-[#e5e5e5] pt-6 flex flex-wrap gap-6">
              {product.sku && (
                <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-[#999999]" /><div><p className="text-xs text-[#999999] uppercase tracking-wider">SKU</p><p className="text-sm font-medium">{product.sku}</p></div></div>
              )}
              {product.category && (
                <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-[#999999]" /><div><p className="text-xs text-[#999999] uppercase tracking-wider">Category</p><p className="text-sm font-medium">{product.category}</p></div></div>
              )}
              {product.brand && (
                <div className="flex items-center gap-2"><Star className="w-4 h-4 text-[#999999]" /><div><p className="text-xs text-[#999999] uppercase tracking-wider">Brand</p><p className="text-sm font-medium">{product.brand}</p></div></div>
              )}
            </div>

            {/* Purchase Limits */}
            {(product.min_quantity > 1 || product.max_quantity) && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888888] mb-2 flex items-center gap-2"><Percent className="w-4 h-4" />Purchase Limits</h3>
                <p className="text-sm text-[#666666]">
                  {product.min_quantity > 1 && `Minimum ${product.min_quantity} items`}{product.min_quantity > 1 && product.max_quantity && " · "}{product.max_quantity && `Maximum ${product.max_quantity} items`}
                </p>
              </div>
            )}

            {/* Add to Cart */}
            <div className="border-t border-[#e5e5e5] pt-6">
              <AddToCartButton 
  product={{ 
    id: product.id, 
    name: product.name, 
    price: product.price,           // Pass base price, not finalPrice
    image: images[0]?.image_url,
    variantName: undefined,         // Add when you implement variant selection
    sku: product.sku,
    weight: product.weight,
    length: product.length,
    width: product.width,
    height: product.height,
    isDigital: product.is_digital,
    shippingFee: product.shipping_fee,
    additionalFee: product.additional_fee,
    platformFee: product.platform_fee,
    platformFeeType: product.platform_fee_type,
    gstPercentage: product.gst_percentage,
    gstMode: product.gst_mode,
    customFields: undefined,        // Add when you implement custom field selection
    comparePrice: product.compare_at_price,
  }} 
  storeSlug={storeSlug} 
  theme={theme} 
/>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 pt-16 border-t border-[#e5e5e5]">
            <h2 className="text-xl font-bold mb-6" style={{ color: theme.text_color }}>You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((item: any) => {
                const itemImage = item.product_images?.[0]?.image_url;
                const itemHasDiscount = item.compare_at_price && item.compare_at_price > item.price;
                return (
                  <Link key={item.id} href={`/${storeSlug}/product/${item.id}`} className="group">
                    <div className="border overflow-hidden transition-all hover:shadow-lg" style={{ borderRadius: theme.border_radius, borderColor: "#e5e5e5", backgroundColor: theme.background_color }}>
                      <div className="aspect-[4/5] overflow-hidden bg-[#f5f5f5] relative">
                        {itemImage ? (
                          <img src={itemImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[#cccccc]" /></div>
                        )}
                        {itemHasDiscount && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: theme.accent_color }}>
                            {Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium line-clamp-2" style={{ color: theme.text_color }}>{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-semibold" style={{ color: theme.text_color }}>₹{item.price?.toLocaleString()}</p>
                          {itemHasDiscount && <p className="text-xs text-[#999999] line-through">₹{item.compare_at_price?.toLocaleString()}</p>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-[#e5e5e5] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-xs text-[#999999]">© {new Date().getFullYear()} {store.name}. Powered by <Link href="/" className="hover:underline" style={{ color: theme.primary_color }}>hookit</Link></p>
        </div>
      </footer>
    </div>
  );
}