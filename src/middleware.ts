import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

const EXCLUDED_ANALYTICS_PATHS = [
  "/dashboard", "/api", "/login", "/signup", "/onboarding",
  "/create-store", "/auth", "/_next", "/favicon.ico",
];

function isValidRedirect(url: string): boolean {
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("@")) return false;
  if (url.includes(":")) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  // 🔒 FIX CVE-2025-29927: Block middleware bypass attempts
  if (request.headers.get("x-middleware-subrequest")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";
  const cleanHost = hostname.replace(/^www\./, "");

  // 🔒 CSRF: Generate/set CSRF token cookie if not present
  const existingCsrf = request.cookies.get("csrf_token")?.value;
  if (!existingCsrf) {
    const csrfToken = generateCsrfToken();
    setCsrfCookie(supabaseResponse, csrfToken);
  }

  // ===== SUBDOMAIN ROUTING =====
  const isMainDomain =
    cleanHost === "hookit.online" ||
    cleanHost === "localhost:3000";

  if (!isMainDomain) {
    const subdomain = cleanHost.replace(".hookit.online", "").split(".")[0];
    const reservedSubdomains = ["www", "api", "admin", "dashboard", "app"];

    if (subdomain && !reservedSubdomains.includes(subdomain)) {
      const url = request.nextUrl.clone();
      url.pathname = `/store/${subdomain}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ===== AUTH PROTECTION =====
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (isValidRedirect(pathname)) {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ===== ANALYTICS TRACKING =====
  const shouldTrack =
    !EXCLUDED_ANALYTICS_PATHS.some((path) => pathname.startsWith(path)) &&
    pathname !== "/" &&
    !pathname.includes(".");

  if (shouldTrack) {
    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const storeSlug = pathParts[0];
      const baseUrl = request.nextUrl.origin;
      fetch(`${baseUrl}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug }),
      }).catch(() => {});
    }
  }

  // 🔒 SECURITY HEADERS
  const securityHeaders = {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://*.supabase.co https://api.razorpay.com; " +
      "frame-src https://checkout.razorpay.com; " +
      "upgrade-insecure-requests;",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};