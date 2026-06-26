import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("billId");

  if (!billId) {
    return NextResponse.json({ error: "Bill ID required" }, { status: 400 });
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bill, error: billError } = await supabase
    .from("monthly_bills")
    .select("*, stores!inner(user_id, name, slug, contact_email)")
    .eq("id", billId)
    .single();

  if (billError || !bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  if (bill.stores.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get order breakdown for Starter plan
  let orderBreakdown = "";
  if (bill.plan_type === "starter") {
    const billMonthStart = new Date(bill.bill_month);
    const billMonthEnd = new Date(billMonthStart.getFullYear(), billMonthStart.getMonth() + 1, 0, 23, 59, 59);

    const { data: orders } = await supabase
  .from("orders")
  .select("id, subtotal, gst_amount, created_at, customer_name")
  .eq("store_id", bill.store_id)
  .neq("status", "cancelled")
  .neq("status", "refunded")
  .gt("subtotal", 0)  // Add this
  .gte("created_at", billMonthStart.toISOString())
  .lte("created_at", billMonthEnd.toISOString())
  .order("created_at", { ascending: false });

    if (orders && orders.length > 0) {
      orderBreakdown = orders.map((o, i) => {
        const commissionable = (o.subtotal || 0) + (o.gst_amount || 0);
        const commission = Math.round(commissionable * 0.03 * 100) / 100;
        const date = new Date(o.created_at).toLocaleDateString("en-IN");
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;">#${o.id.slice(0, 8)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${o.customer_name}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${date}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">₹${commissionable.toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">₹${commission.toFixed(2)}</td>
          </tr>
        `;
      }).join("");
    }
  }

  const billMonthLabel = new Date(bill.bill_month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const paidDate = bill.paid_at
    ? new Date(bill.paid_at).toLocaleDateString("en-IN")
    : "-";

  const statusColor =
    bill.status === "paid"
      ? "#22c55e"
      : bill.status === "overdue"
      ? "#ef4444"
      : bill.status === "waived"
      ? "#888888"
      : "#f59e0b";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${bill.stores.name}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 40px 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 40px; height: 40px; background: #1a1a1a; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
    .brand-name { font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .status { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: ${statusColor}15; color: ${statusColor}; }
    .invoice-title { font-size: 32px; font-weight: 800; color: #1a1a1a; margin-bottom: 8px; }
    .invoice-meta { color: #666; font-size: 14px; margin-bottom: 32px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 0.5px; margin-bottom: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .info-label { color: #666; font-size: 14px; }
    .info-value { color: #1a1a1a; font-size: 14px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #1a1a1a; font-weight: 600; color: #1a1a1a; font-size: 12px; text-transform: uppercase; }
    td { color: #333; }
    .total-row { display: flex; justify-content: space-between; padding: 20px 0; border-top: 2px solid #1a1a1a; margin-top: 20px; }
    .total-label { font-size: 18px; font-weight: 700; color: #1a1a1a; }
    .total-value { font-size: 24px; font-weight: 800; color: #1a1a1a; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center; color: #999; font-size: 12px; }
    .no-orders { text-align: center; padding: 32px; color: #999; font-size: 14px; }
    @media (max-width: 600px) {
      .invoice { padding: 24px; }
      .header { flex-direction: column; gap: 16px; }
      table { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">
        <div class="brand-icon">H</div>
        <div class="brand-name">hookit</div>
      </div>
      <div class="status">${bill.status}</div>
    </div>

    <div class="invoice-title">Invoice</div>
    <div class="invoice-meta">Bill for ${billMonthLabel} &middot; Generated on ${new Date(bill.created_at).toLocaleDateString("en-IN")}</div>

    <div class="section">
      <div class="section-title">Billed To</div>
      <div style="font-size: 16px; font-weight: 600; color: #1a1a1a;">${bill.stores.name}</div>
      <div style="font-size: 14px; color: #666; margin-top: 4px;">${bill.stores.slug}.hookit.online</div>
      ${bill.stores.contact_email ? `<div style="font-size: 14px; color: #666;">${bill.stores.contact_email}</div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Plan Details</div>
      <div class="info-row">
        <span class="info-label">Plan</span>
        <span class="info-value" style="text-transform: capitalize;">${bill.plan_type}</span>
      </div>
      ${bill.plan_type === "starter" ? `
      <div class="info-row">
        <span class="info-label">Commission Rate</span>
        <span class="info-value">3% of (Subtotal + GST)</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Orders</span>
        <span class="info-value">${bill.total_orders_count}</span>
      </div>
      ` : `
      <div class="info-row">
        <span class="info-label">Subscription Amount</span>
        <span class="info-value">₹${bill.subscription_amount.toFixed(2)}/month</span>
      </div>
      `}
      <div class="info-row">
        <span class="info-label">Due Date</span>
        <span class="info-value">${new Date(bill.due_date).toLocaleDateString("en-IN")}</span>
      </div>
      ${bill.status === "paid" ? `
      <div class="info-row">
        <span class="info-label">Paid On</span>
        <span class="info-value">${paidDate}</span>
      </div>
      ` : ""}
    </div>

    ${bill.plan_type === "starter" && orderBreakdown ? `
    <div class="section">
      <div class="section-title">Order Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th style="text-align:right;">Commissionable</th>
            <th style="text-align:right;">Commission (3%)</th>
          </tr>
        </thead>
        <tbody>
          ${orderBreakdown}
        </tbody>
      </table>
    </div>
    ` : ""}

    ${bill.plan_type === "starter" && !orderBreakdown ? `
    <div class="no-orders">No orders found for this billing period.</div>
    ` : ""}

    <div class="total-row">
      <span class="total-label">Total Amount</span>
      <span class="total-value">₹${bill.total_amount.toFixed(2)}</span>
    </div>

    <div class="footer">
      <p>Thank you for using Hookit!</p>
      <p style="margin-top: 4px;">For support, contact us at support@hookit.online</p>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}