import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Script from "next/script";
import { MobileSidebarWrapper } from "@/components/dashboard/mobile-sidebar-wrapper";

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
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-[#f7f7f7] flex">
        <MobileSidebarWrapper storeSlug={storeSlug} storeName={store.name} />

        <main className="flex-1 lg:ml-64 w-full min-w-0">
          <div className="pt-[60px] lg:pt-6 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}