import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths to NOT track for analytics
const EXCLUDED_ANALYTICS_PATHS = [
  "/dashboard",
  "/api",
  "/login",
  "/signup",
  "/onboarding",
  "/create-store",
  "/auth",
  "/_next",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Always refresh the session first
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (
    (pathname === "/login" || pathname === "/signup") &&
    user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ===== ANALYTICS TRACKING =====
  // Only track storefront pages (not excluded paths, not root, not files)
  const shouldTrack = !EXCLUDED_ANALYTICS_PATHS.some((path) => pathname.startsWith(path)) &&
    pathname !== "/" &&
    !pathname.includes(".");

  if (shouldTrack) {
    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const storeSlug = pathParts[0];
      
      // Fire-and-forget analytics tracking
      // Use absolute URL to avoid relative path issues
      const baseUrl = request.nextUrl.origin;
      fetch(`${baseUrl}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug }),
      }).catch(() => {
        // Silently fail — analytics should never break the site
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};