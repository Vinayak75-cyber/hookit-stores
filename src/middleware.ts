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

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
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
      // Fire and forget — no waitUntil in middleware
      fetch(`${baseUrl}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug }),
      }).catch(() => {});
    }
  }

  // 🔒 CSRF: Generate/set CSRF token cookie if not present
    // 🔒 CSRF: Always ensure a valid CSRF token cookie exists
  let csrfToken = request.cookies.get("csrf_token")?.value;
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
  }
  setCsrfCookie(response, csrfToken);

    // 🔒 SECURITY HEADERS (skip for API routes)
  if (!pathname.startsWith("/api/")) {
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
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://static.cloudflareinsights.com; " +
        "script-src-elem 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://static.cloudflareinsights.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com; " +
        "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; " +
        "upgrade-insecure-requests;",
    };

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};