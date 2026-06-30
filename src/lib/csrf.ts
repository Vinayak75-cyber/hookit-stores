import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

// ===== SERVER-SIDE (Middleware & API routes) =====

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function validateCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return timingSafeEqual(cookieToken, headerToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: "Invalid or missing CSRF token" },
    { status: 403 }
  );
}

// ===== CLIENT-SIDE HELPERS =====

/**
 * Get CSRF token from cookie (client-side only)
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get headers with CSRF token for fetch requests
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }
  return headers;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };