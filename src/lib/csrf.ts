import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Set CSRF cookie on the response
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS to send in header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Validate CSRF token from header against cookie
 * Returns true if valid, false otherwise
 */
export function validateCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison
  try {
    const crypto = require("crypto");
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    return false;
  }
}

/**
 * Helper to return 403 CSRF error response
 */
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: "Invalid or missing CSRF token" },
    { status: 403 }
  );
}

/**
 * Get CSRF token from cookie (for client-side reading)
 */
export function getCsrfTokenFromCookie(): string | undefined {
  // This is used server-side to get the token to pass to client
  // Client reads cookie directly via document.cookie
  return undefined;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };