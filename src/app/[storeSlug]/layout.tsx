import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  
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

  const { data: store } = await supabase
    .from("stores")
    .select("name, description")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .single();

  return {
    title: store?.name ? `${store.name} | Hookit` : "Hookit Store",
    description: store?.description || "Your favorite online store",
  };
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}