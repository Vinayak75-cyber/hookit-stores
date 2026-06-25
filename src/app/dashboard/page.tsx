import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, Store, ArrowRight, Settings, ShoppingBag } from "lucide-react";

async function getUserStores() {
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
  if (!user) return null;

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return { user, stores: stores || [] };
}

export default async function DashboardPage() {
  const data = await getUserStores();

  if (!data) {
    redirect("/login");
  }

  const { stores } = data;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <form action="/api/auth?action=logout" method="POST">
            <button
              type="submit"
              className="text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
            Your stores
          </h1>
          <p className="text-[#888888] text-lg max-w-xl mx-auto">
            Manage your online stores or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Create New Store Card */}
          <Link
            href="/onboarding"
            className="group border-2 border-dashed border-[#e5e5e5] rounded-2xl flex flex-col items-center justify-center text-center hover:border-[#1a1a1a] transition-colors min-h-[320px]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-4 group-hover:bg-[#1a1a1a] transition-colors">
              <Plus className="w-5 h-5 text-[#666666] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">Create new store</h3>
            <p className="text-sm text-[#888888]">Start a new business</p>
          </Link>

          {/* Store Cards */}
          {stores.map((store) => (
            <div
              key={store.id}
              className="group relative bg-white rounded-2xl border-2 border-[#e5e5e5] hover:border-[#1a1a1a] hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Banner Image */}
              <div className="relative h-48 overflow-hidden bg-[#1a1a1a]">
                {store.banner_url ? (
                  <img
                    src={store.banner_url}
                    alt={store.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-[#cccccc]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] overflow-hidden flex items-center justify-center group-hover:bg-[#1a1a1a] transition-colors">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1a1a1a]">{store.name}</h3>
                    <p className="text-xs text-[#888888]">{store.slug}.hookit.online</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Link
                    href={`/dashboard/${store.slug}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
                  >
                    Dashboard
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href={`/dashboard/${store.slug}/settings`}
                    className="p-2.5 rounded-xl border border-[#e5e5e5] text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}