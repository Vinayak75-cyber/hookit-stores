import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.BILLING_SECRET_KEY || "hookit-billing-2026";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Find all pending bills where due_date has passed (after 5th)
  const { data: unpaidBills, error: billsError } = await supabase
    .from("monthly_bills")
    .select("id, store_id, total_amount, bill_month")
    .eq("status", "pending")
    .lt("due_date", todayStr);

  if (billsError) {
    return NextResponse.json({ error: billsError.message }, { status: 500 });
  }

  let deactivated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const bill of unpaidBills || []) {
    // Skip if bill amount is ₹0 (shouldn't happen, but safety check)
    if (bill.total_amount === 0) {
      // Mark as waived instead
      await supabase
        .from("monthly_bills")
        .update({ status: "waived" })
        .eq("id", bill.id);
      skipped++;
      continue;
    }

    // Update bill status to overdue
    const { error: billUpdateError } = await supabase
      .from("monthly_bills")
      .update({ status: "overdue" })
      .eq("id", bill.id);

    if (billUpdateError) {
      errors.push(`Bill ${bill.id}: ${billUpdateError.message}`);
      continue;
    }

    // Deactivate the store
    const { error: storeError } = await supabase
      .from("stores")
      .update({ is_active: false })
      .eq("id", bill.store_id);

    if (storeError) {
      errors.push(`Store ${bill.store_id}: ${storeError.message}`);
    } else {
      deactivated++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Deactivation check completed for bills due before ${todayStr}`,
    deactivated,
    skipped,
    totalUnpaid: unpaidBills?.length || 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}