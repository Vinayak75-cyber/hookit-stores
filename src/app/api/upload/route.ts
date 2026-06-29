import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Ratelimit } from "@upstash/ratelimit";
import { validateCsrf, csrfErrorResponse } from "@/lib/csrf";
import { Redis } from "@upstash/redis";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

// ====== CONFIGURATION ======
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

// Magic bytes signatures for real file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
  "image/gif": [0x47, 0x49, 0x46, 0x38],
};

// 🔒 RATE LIMITING: Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  analytics: true,
  prefix: "ratelimit:upload",
});

function getIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() 
    || realIP 
    || "127.0.0.1";
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ====== VALIDATION HELPERS ======

/**
 * Validate file by checking magic bytes (first bytes of file content).
 * This cannot be spoofed by changing the Content-Type header.
 */
function validateMagicBytes(buffer: Buffer): string | null {
  for (const [mimeType, signature] of Object.entries(MAGIC_BYTES)) {
    if (buffer.length < signature.length) continue;
    
    const matches = signature.every((byte, i) => buffer[i] === byte);
    if (matches) return mimeType;
  }
  return null;
}

/**
 * Validate file size on server side.
 */
function validateFileSize(buffer: Buffer): boolean {
  return buffer.length <= MAX_FILE_SIZE;
}

/**
 * Extract safe extension from validated MIME type.
 */
function getSafeExtension(mimeType: string): string | null {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extMap[mimeType] || null;
}

/**
 * Generate a secure, random filename. Completely ignores user input.
 */
function generateSecureFileName(type: string, extension: string): string {
  const uuid = randomUUID();
  const timestamp = Date.now();
  return `${type}/${timestamp}-${uuid}.${extension}`;
}

/**
 * Placeholder for malware scanning. Wire up ClamAV here later.
 */
async function scanForMalware(_buffer: Buffer): Promise<{ clean: boolean; reason?: string }> {
  // TODO: Integrate ClamAV or similar scanning service
  // Example: const clamscan = new NodeClam().init({...});
  // const { isInfected } = await clamscan.scanBuffer(buffer);
  // return { clean: !isInfected, reason: isInfected ? "Malware detected" : undefined };
  
  // For now, pass through — add real scanning in production
  return { clean: true };
}

// ====== MAIN HANDLER ======

export async function POST(request: NextRequest) {

  if (!validateCsrf(request)) {
  return csrfErrorResponse();
}

  // 🔒 RATE LIMITING
  const ip = getIP(request);
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

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

  // 🔒 AUTH: Verify user is authenticated
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "logo" | "banner" | "product"

    // 1. Basic presence check
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // 2. Validate upload type (controls folder path)
    const validTypes = ["logo", "banner", "product"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // 3. Convert to buffer for server-side validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. 🔒 SERVER-SIDE SIZE CHECK (cannot be bypassed)
    if (!validateFileSize(buffer)) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // 5. 🔒 MAGIC BYTES VALIDATION (real file type, not spoofable MIME)
    const detectedType = validateMagicBytes(buffer);
    if (!detectedType) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // 6. 🔒 DOUBLE-CHECK: Also verify the detected type is in our allowlist
    if (!ALLOWED_TYPES.includes(detectedType as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // 7. 🔒 MALWARE SCAN (placeholder — wire up ClamAV)
    const scanResult = await scanForMalware(buffer);
    if (!scanResult.clean) {
      return NextResponse.json(
        { error: scanResult.reason || "File failed security scan" },
        { status: 400 }
      );
    }

    // 8. 🔒 GENERATE SECURE FILENAME (UUID-based, ignores user input completely)
    const safeExtension = getSafeExtension(detectedType);
    if (!safeExtension) {
      return NextResponse.json({ error: "Could not determine file extension" }, { status: 500 });
    }

    const secureFileName = generateSecureFileName(type, safeExtension);

    // 9. Upload to R2 with secure filename
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: secureFileName,
        Body: buffer,
        ContentType: detectedType, // Use detected type, NOT client-provided type
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${secureFileName}`;

    // 10. Return success with rate limit headers
    const response = NextResponse.json({ url: publicUrl });
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());

    return response;

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}