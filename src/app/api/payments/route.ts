import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

// ====== ZOD SCHEMAS ======

const SavePaymentSettingsSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  razorpay_key_id: z.string().max(200).optional().nullable(),
  razorpay_key_secret: z.string().max(500).optional().nullable(),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  test_mode: z.boolean().default(true),
});

const StoreSlugParamSchema = z.object({
  store_slug: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

// ====== ENCRYPTION ======

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-gcm";

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn("⚠️ PAYMENT_ENCRYPTION_KEY not set or invalid. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
}

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) return text;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string | null {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) return encryptedText;
  if (!encryptedText.includes(":")) return encryptedText;

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return null;
  }
}

// ====== SUPABASE CLIENT ======

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

// ====== POST — Save payment settings ======

export async function POST(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  let body: z.infer<typeof SavePaymentSettingsSchema>;
  try {
    const rawBody = await request.json();
    body = SavePaymentSettingsSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify store ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("id", body.store_id)
    .single();

  if (!store || store.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build update data with ONLY validated fields
  const updateData: Record<string, any> = {
    store_id: body.store_id,
    razorpay_key_id: body.razorpay_key_id?.trim() || null,
    currency: body.currency,
    test_mode: body.test_mode,
    is_connected: !!body.razorpay_key_id,
    updated_at: new Date().toISOString(),
  };

  // Encrypt secret before saving
  if (body.razorpay_key_secret && body.razorpay_key_secret !== "••••••••••••") {
    const encrypted = encrypt(body.razorpay_key_secret.trim());
    updateData.razorpay_key_secret = encrypted;
  }

  const { error } = await supabase
    .from("payment_settings")
    .upsert(updateData, { onConflict: "store_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ====== GET — Fetch payment settings ======

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawStoreSlug = searchParams.get("store_slug");

  // Validate store_slug parameter
  const paramValidation = StoreSlugParamSchema.safeParse({ store_slug: rawStoreSlug });
  if (!paramValidation.success) {
    return NextResponse.json(
      { error: "Invalid store_slug", details: paramValidation.error.issues },
      { status: 400 }
    );
  }

  const { store_slug } = paramValidation.data;

  const supabase = await getSupabase();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", store_slug)
    .eq("is_active", true)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("razorpay_key_id, razorpay_key_secret, currency, test_mode, is_connected")
    .eq("store_id", store.id)
    .single();

  if (!settings || !settings.is_connected) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 400 });
  }

  // Decrypt secret for server-side use
  const decryptedSecret = decrypt(settings.razorpay_key_secret);

  return NextResponse.json({
    razorpay_key_id: settings.razorpay_key_id,
    razorpay_key_secret: decryptedSecret,
    currency: settings.currency || "INR",
    test_mode: settings.test_mode,
  });
}