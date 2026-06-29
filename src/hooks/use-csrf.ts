"use client";

import { useState, useEffect } from "react";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Get CSRF token from browser cookies
 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

/**
 * Client-side hook to get CSRF token for API requests
 */
export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getCookie(CSRF_COOKIE_NAME));
  }, []);

  return token;
}

/**
 * Helper to make authenticated API fetch with CSRF header
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCookie(CSRF_COOKIE_NAME);

  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Ensure cookies are sent
  });
}

export { CSRF_HEADER_NAME };