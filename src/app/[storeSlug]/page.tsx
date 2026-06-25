"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Store,
  Heart,
  Package,
  ArrowRight,
  Tag,
  Layers,
} from "lucide-react";
import { CartIcon } from "@/components/storefront/cart-icon";
import { createClient } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number | null;
  product_images: { image_url: string }[] | null;
  product_collections: { collection_id: string }[] | null;
  created_at: string;
}

interface Collection {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
  theme_settings: any;
  store_settings: any;
}

export default function StorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [storeSlug, setStoreSlug] = useState<string>("");
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => {
      setStoreSlug(p.storeSlug);
      // Check URL for collection param on load
      const coll = searchParams.get("collection");
      if (coll) setActiveCollection(coll);
    });
  }, [params, searchParams]);

  useEffect(() => {
    if (!storeSlug) return;
    fetchStoreData();
  }, [storeSlug]);

  // Filter products when activeCollection changes
useEffect(() => {
  if (!activeCollection) {
    setProducts(allProducts);
    return;
  }
  
  const filtered = allProducts.filter((product) =>
    product.product_collections?.some(
      (pc: any) => pc.collection_id === activeCollection
    )
  );
  
  setProducts(filtered);
}, [activeCollection, allProducts]);

  const fetchStoreData = async () => {
    setLoading(true);
    
    // Fetch store
    const { data: storeData } = await supabase
      .from("stores")
      .select("*, theme_settings(*), store_settings(*)")
      .eq("slug", storeSlug)
      .eq("is_active", true)
      .single();

    if (!storeData) {
      router.push("/404");
      return;
    }

    setStore(storeData);

    // Fetch all products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`
        *,
        product_images(image_url)
      `)
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .eq("visibility", "active")
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("Products fetch error:", productsError);
    }

    // Fetch collection_products separately (no store_id column)
    const { data: collectionProductsData, error: cpError } = await supabase
      .from("collection_products")
      .select("*");

    if (cpError) {
      console.error("Collection products fetch error:", cpError);
    }

    // Merge collection_products into products manually
    const prods = (productsData || []).map((product: any) => ({
      ...product,
      product_collections: (collectionProductsData || []).filter(
        (cp: any) => cp.product_id === product.id
      ),
    }));

    setAllProducts(prods);
    setProducts(prods);

    // Fetch collections
    const { data: collectionsData } = await supabase
      .from("collections")
      .select("*")
      .eq("store_id", storeData.id)
      .order("created_at", { ascending: false });

    setCollections(collectionsData || []);
    setLoading(false);
  };

  // Filter products when collection changes
  const handleCollectionClick = (collectionId: string | null) => {
  if (!collectionId) {
    router.push(`/${storeSlug}`);
    setActiveCollection(null);
    return;
  }
  router.push(`/${storeSlug}?collection=${collectionId}`);
  setActiveCollection(collectionId);
};

  if (loading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#1a1a1a] rounded-full animate-spin" />
      </div>
    );
  }

  const theme = (Array.isArray(store.theme_settings) 
    ? store.theme_settings?.[0] 
    : store.theme_settings) || {
    primary_color: "#1a1a1a",
    background_color: "#ffffff",
    text_color: "#1a1a1a",
    accent_color: "#c9a96e",
    font_family: "Inter",
    border_radius: "12px",
  };

  const gridCols: Record<string, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  const hasDiscounts = allProducts.some(
    (p) => p.compare_at_price && p.compare_at_price > p.price
  );
   const discountProduct = allProducts.find(
    (p) => p.compare_at_price && p.compare_at_price > p.price
  );
  const maxDiscount = discountProduct && discountProduct.compare_at_price
    ? Math.round(
        ((discountProduct.compare_at_price - discountProduct.price) /
          discountProduct.compare_at_price) *
          100
      )
    : 0;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.background_color,
        color: theme.text_color,
        fontFamily: theme.font_family,
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-[#e5e5e5]/50 backdrop-blur-md"
        style={{ backgroundColor: `${theme.background_color}ee` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2.5 shrink-0">
            {theme.show_logo !== false && (
              <>
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#e5e5e5]/50"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: theme.primary_color }}
                  >
                    <Store className="w-4 h-4 text-white" />
                  </div>
                )}
              </>
            )}
            <span
              className="font-bold text-lg hidden sm:block tracking-tight"
              style={{ color: theme.text_color }}
            >
              {store.name}
            </span>
          </Link>

          {theme.show_search !== false && (
            <div className="flex-1 max-w-lg hidden sm:block">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999] group-focus-within:text-[#1a1a1a] transition-colors" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-[#f5f5f5] border-0 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:bg-white transition-all"
                  style={{ color: theme.text_color }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
           <CartIcon storeSlug={storeSlug} theme={theme} />
          </div>
        </div>
      </header>

      {/* Banner */}
      {theme.show_banner !== false && store.banner_url && (
        <div
          className="relative w-full overflow-hidden"
          style={{ height: theme.banner_height || "400px" }}
        >
          <img
            src={store.banner_url}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-2xl">
              {hasDiscounts && (
                <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-[#1a1a1a] px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-lg">
                  <Tag className="w-4 h-4" />
                  Up to {maxDiscount}% OFF
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
                {store.name}
              </h1>
              <p className="text-white/80 text-base max-w-lg mx-auto mb-6">
                {store.description || "Discover amazing products"}
              </p>

              <Link
                href="#products"
                className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#f5f5f5] transition-colors shadow-lg"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Store Info (no banner) */}
      {!store.banner_url && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ color: theme.text_color }}
          >
            {store.name}
          </h1>
          <p className="text-[#888888] max-w-lg mx-auto">
            {store.description || "Discover amazing products"}
          </p>
        </div>
      )}

      {/* Collection Pills */}
      {collections.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-1.5 text-sm text-[#888888] shrink-0 mr-1">
              <Layers className="w-4 h-4" />
              <span className="font-medium">Collections:</span>
            </div>

            <button
              onClick={() => handleCollectionClick(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                !activeCollection
                  ? "text-white"
                  : "bg-white text-[#666666] border border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
              }`}
              style={
                !activeCollection
                  ? { backgroundColor: theme.primary_color, color: "#fff" }
                  : {}
              }
            >
              All Products
            </button>

            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => handleCollectionClick(collection.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shadow-sm ${
                  activeCollection === collection.id
                    ? "text-white border-transparent"
                    : "bg-white text-[#666666] border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                }`}
                style={
                  activeCollection === collection.id
                    ? { backgroundColor: theme.primary_color, color: "#fff" }
                    : {}
                }
              >
                {collection.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: theme.text_color }}
            >
              {activeCollection
                ? collections.find((c) => c.id === activeCollection)?.name ||
                  "Products"
                : "All Products"}
            </h2>
            <p className="text-xs text-[#999999] mt-0.5">
              {products.length} items available
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-3 text-[#cccccc]" />
            <h3
              className="text-base font-medium mb-1"
              style={{ color: theme.text_color }}
            >
              No products found
            </h3>
            <p className="text-[#888888] text-sm">
              {activeCollection
                ? "No products in this collection yet."
                : "Check back soon for new arrivals!"}
            </p>
          </div>
        ) : (
          <div
            className={`grid ${
              gridCols[theme.product_grid_columns as keyof typeof gridCols] ||
              gridCols[3]
            } gap-4`}
          >
            {products.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;
              const hasDiscount =
  product.compare_at_price !== null && product.compare_at_price > product.price;
const discountPercent = hasDiscount && product.compare_at_price
  ? Math.round(
      ((product.compare_at_price - product.price) /
        product.compare_at_price) *
        100
    )
  : 0;

              return (
                <Link
                  key={product.id}
                  href={`/${storeSlug}/product/${product.id}`}
                  className="group block"
                >
                  <div
                    className="border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    style={{
                      borderRadius: theme.border_radius,
                      borderColor: "#e5e5e5",
                      backgroundColor: theme.background_color,
                    }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-[#cccccc]" />
                        </div>
                      )}

                      {/* Discount badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-500 text-white shadow-sm">
                          {discountPercent}% OFF
                        </div>
                      )}

                      {/* Low stock badge */}
                      {product.inventory_quantity !== null &&
                        product.inventory_quantity <= 5 &&
                        product.inventory_quantity > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-500 text-white shadow-sm">
                            Only {product.inventory_quantity} left
                          </div>
                        )}

                      {/* Wishlist */}
                      <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm">
                        <Heart className="w-4 h-4 text-[#666666]" />
                      </div>
                    </div>

                    <div className="p-3">
                      <h3
                        className="text-sm font-medium mb-1 line-clamp-1"
                        style={{ color: theme.text_color }}
                      >
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: theme.text_color }}
                        >
                          ₹{product.price?.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-[#999999] line-through">
                            ₹{product.compare_at_price?.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-[#999999]">
              © {new Date().getFullYear()} {store.name}. All rights reserved.
            </p>
            <p className="text-[10px] text-[#999999]">
              Powered by{" "}
              <Link
                href="/"
                className="font-semibold hover:underline"
                style={{ color: theme.primary_color }}
              >
                hookit
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}