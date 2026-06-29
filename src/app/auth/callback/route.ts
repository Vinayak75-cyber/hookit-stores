import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// 🔒 SECURITY: Whitelist of allowed redirect paths
const ALLOWED_REDIRECTS = [
  "/dashboard",
  "/dashboard/",
  "/onboarding",
  "/create-store",
  "/create-event-store",
];

function isValidRedirect(url: string): boolean {
  // Must be a relative path starting with /
  if (!url.startsWith("/")) return false;
  
  // Must not be a protocol-relative URL (//evil.com)
  if (url.startsWith("//")) return false;
  
  // Must not contain @ (prevents user@evil.com trick)
  if (url.includes("@")) return false;
  
  // Must be in whitelist OR start with /dashboard/
  return ALLOWED_REDIRECTS.includes(url) || url.startsWith("/dashboard/");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";

  // 🔒 SECURITY: Validate redirect to prevent open redirect attacks
  const next = isValidRedirect(rawNext) ? rawNext : "/dashboard";

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}