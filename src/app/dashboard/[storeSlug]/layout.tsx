import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  Store,
  ChevronRight,
  LogOut,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

async function getStore(storeSlug: string) {
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .eq("user_id", user.id)
    .single();

  return store ? { store, user } : null;
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const data = await getStore(storeSlug);

  if (!data) redirect("/login");
  const { store } = data;

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex">
      {/* Mobile Overlay */}
      <div 
        id="sidebar-overlay"
        className="fixed inset-0 bg-black/50 z-40 hidden lg:hidden"
        onClick={() => document.getElementById('mobile-sidebar')?.classList.add('-translate-x-full')}
      />

      {/* Sidebar - Hidden on mobile by default, shown on lg+ */}
      <aside 
        id="mobile-sidebar"
        className="w-64 bg-white border-r border-[#e5e5e5] fixed h-full left-0 top-0 z-50 flex flex-col -translate-x-full lg:translate-x-0 transition-transform duration-300"
      >
        {/* Logo + Close Button */}
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-black" />
            <span className="text-xl font-bold text-[#1a1a1a] tracking-tight">hookit</span>
          </Link>
          <button 
            className="lg:hidden p-1"
            onClick={() => document.getElementById('mobile-sidebar')?.classList.add('-translate-x-full')}
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </div>

        {/* Store Info */}
        <div className="px-4 py-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-[#666666]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a] truncate">{store.name}</p>
              <p className="text-xs text-[#999999] truncate">{storeSlug}.hookit.online</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <SidebarNav storeSlug={storeSlug} />
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#e5e5e5] space-y-2">
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors"
          >
            <Store className="w-4 h-4 shrink-0" />
            View Store
            <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
          </Link>
          <form action="/api/auth?action=logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#666666] hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 w-full min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              document.getElementById('mobile-sidebar')?.classList.remove('-translate-x-full');
              document.getElementById('sidebar-overlay')?.classList.remove('hidden');
            }}
            className="p-2 -ml-2 rounded-xl hover:bg-[#f5f5f5] transition-colors"
          >
            <Menu className="w-5 h-5 text-[#1a1a1a]" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-black" />
            <span className="text-lg font-bold text-[#1a1a1a]">hookit</span>
          </Link>
          <div className="w-9" /> {/* Spacer for balance */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}