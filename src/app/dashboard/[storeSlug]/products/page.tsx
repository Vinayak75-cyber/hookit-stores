import { notFound, redirect } from "next/navigation";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Package,
  Pencil,
  Trash2,
  Eye,
  ArrowUpRight,
} from "lucide-react";

async function getProducts(storeSlug: string, searchQuery?: string) {
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
  console.log("Products page - user:", user?.id);
  if (!user) return null;

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .eq("user_id", user.id)
    .single();

  console.log("Products page - store:", store, "error:", storeError);

  if (!store) return null;

  let query = supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.ilike("name", `%${searchQuery}%`);
  }

  const { data: products } = await query;

  return { storeId: store.id, products: products || [] };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { storeSlug } = await params;
  const { q } = await searchParams;
  const data = await getProducts(storeSlug, q);

  if (!data) {
    redirect("/login");
  }

  const { storeId, products } = data;

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    draft: "bg-gray-100 text-gray-600",
    archived: "bg-red-50 text-red-600",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Products</h1>
          <p className="text-[#888888] text-sm mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} in your store
          </p>
        </div>
        <Link
          href={`/dashboard/${storeSlug}/products/new`}
          className="flex items-center justify-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add product</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <form action={`/dashboard/${storeSlug}/products`} method="GET">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search products..."
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </form>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 text-[#cccccc]" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-[#1a1a1a] mb-2">No products yet</h3>
          <p className="text-[#888888] text-sm mb-6 max-w-sm mx-auto">
            Start selling by adding your first product to the store.
          </p>
          <Link
            href={`/dashboard/${storeSlug}/products/new`}
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first product
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Product
                    </th>
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Inventory
                    </th>
                    <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Price
                    </th>
                    <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const mainImage = product.product_images?.[0]?.image_url;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] overflow-hidden shrink-0">
                              {mainImage ? (
                                <img
                                  src={mainImage}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-[#cccccc]" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1a1a1a] truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-[#999999] truncate">
                                {product.sku || "No SKU"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              statusColors[product.status || "draft"] ||
                              "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {(product.status || "draft").charAt(0).toUpperCase() +
                              (product.status || "draft").slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              (product.stock || 0) > 10
                                ? "text-green-600"
                                : (product.stock || 0) > 0
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock || 0} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-medium text-[#1a1a1a]">
                            ₹{product.price?.toLocaleString()}
                          </p>
                          {product.compare_at_price && (
                            <p className="text-xs text-[#999999] line-through">
                              ₹{product.compare_at_price.toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/${storeSlug}/product/${product.id}`}
                              target="_blank"
                              className="p-2 rounded-lg text-[#999999] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
                              title="View on store"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/dashboard/${storeSlug}/products/${product.id}/edit`}
                              className="p-2 rounded-lg text-[#999999] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <DeleteProductButton
                              productId={product.id}
                              productName={product.name}
                              storeSlug={storeSlug}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {products.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;
              return (
                <div
                  key={product.id}
                  className="bg-white border border-[#e5e5e5] rounded-2xl p-4 active:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-[#f5f5f5] overflow-hidden shrink-0">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#cccccc]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#999999] mt-0.5">
                        {product.sku || "No SKU"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[product.status || "draft"] ||
                            "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {(product.status || "draft").charAt(0).toUpperCase() +
                            (product.status || "draft").slice(1)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            (product.stock || 0) > 10
                              ? "text-green-600"
                              : (product.stock || 0) > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.stock || 0} in stock
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#f5f5f5]">
                    <div>
                      <p className="text-base font-bold text-[#1a1a1a]">
                        ₹{product.price?.toLocaleString()}
                      </p>
                      {product.compare_at_price && (
                        <p className="text-xs text-[#999999] line-through">
                          ₹{product.compare_at_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/${storeSlug}/product/${product.id}`}
                        target="_blank"
                        className="p-2 rounded-lg text-[#999999] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
                        title="View on store"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/dashboard/${storeSlug}/products/${product.id}/edit`}
                        className="p-2 rounded-lg text-[#999999] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                        storeSlug={storeSlug}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}