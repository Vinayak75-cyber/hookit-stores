import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis instance from env vars
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different endpoints
export const ratelimits = {
  // Auth: 5 requests per 15 minutes (login/signup)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "ratelimit:auth",
  }),

  // General API: 100 requests per 15 minutes
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "15 m"),
    analytics: true,
    prefix: "ratelimit:api",
  }),

  // Billing/Payments: 20 requests per 15 minutes
  billing: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "15 m"),
    analytics: true,
    prefix: "ratelimit:billing",
  }),

  // Upload: 10 requests per 15 minutes
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
    prefix: "ratelimit:upload",
  }),
};

// Helper to get IP from request
export function getIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() 
    || realIP 
    || "127.0.0.1";
}