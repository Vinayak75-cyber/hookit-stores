import { NextRequest, NextResponse } from "next/server";
import { ratelimits, getIP } from "./ratelimit";

type RateLimitType = keyof typeof ratelimits;

export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType,
  handler: () => Promise<Response>
): Promise<Response> {
  const ip = getIP(request);
  const { success, limit, remaining, reset } = await ratelimits[type].limit(ip);

  if (!success) {
    return NextResponse.json(
      { 
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  const response = await handler();
  
  // Add rate limit headers to successful responses
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  
  return response;
}