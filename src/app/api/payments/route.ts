import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Encryption config
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
  
  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string | null {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) return encryptedText;
  
  // Check if already encrypted (has : separators)
  if (!encryptedText.includes(":")) return encryptedText; // Plain text fallback
  
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

// Helper to get supabase client
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

// POST — Save payment settings (dashboard)
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", body.store_id)
    .eq("user_id", user.id)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updateData: any = {
    store_id: body.store_id,
    razorpay_key_id: body.razorpay_key_id?.trim() || null,
    currency: body.currency || "INR",
    test_mode: body.test_mode ?? true,
    is_connected: !!body.razorpay_key_id,
    updated_at: new Date().toISOString(),
  };

  // Encrypt secret before saving
    // Encrypt secret before saving
  if (body.razorpay_key_secret && body.razorpay_key_secret !== "••••••••••••") {
    console.log("🔐 ENCRYPTION_KEY present:", !!ENCRYPTION_KEY, "length:", ENCRYPTION_KEY?.length);
    console.log("🔐 About to encrypt secret starting with:", body.razorpay_key_secret.substring(0, 10));
    const encrypted = encrypt(body.razorpay_key_secret.trim());
    console.log("🔐 Encrypted result starts with:", encrypted.substring(0, 20));
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

// GET — Fetch payment settings for a store (used by checkout to get key_id)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeSlug = searchParams.get("store_slug");

  if (!storeSlug) {
    return NextResponse.json({ error: "store_slug required" }, { status: 400 });
  }

  const supabase = await getSupabase();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
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

  // Decrypt secret for server-side use (e.g., creating Razorpay orders)
  const decryptedSecret = decrypt(settings.razorpay_key_secret);

  // Return ONLY the public key_id, never the secret
  return NextResponse.json({
    razorpay_key_id: settings.razorpay_key_id,
    razorpay_key_secret: decryptedSecret, // Server-side only — needed for order creation
    currency: settings.currency || "INR",
    test_mode: settings.test_mode,
  });
}