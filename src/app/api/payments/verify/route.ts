import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Lazy-init Resend only when needed
let resend: any = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    const { Resend } = require("resend");
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

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

async function sendOrderNotificationEmail(
  toEmail: string,
  storeName: string,
  storeSlug: string,
  orderDetails: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    productNames: string[];
    currency: string;
  }
) {
  console.log("📧 Attempting to send store owner email to:", toEmail);

  const resendClient = getResend();
  if (!resendClient) {
    console.error("❌ RESEND_API_KEY not set or Resend not initialized");
    return;
  }

  const productList = orderDetails.productNames.join(", ");
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: orderDetails.currency || "INR",
  }).format(orderDetails.totalAmount);

  console.log("📧 Email details:", {
    to: toEmail,
    store: storeName,
    amount: formattedAmount,
    products: productList,
  });

  try {
    const result = await resendClient.emails.send({
      from: "Hookit <orders@hookit.online>",
      to: [toEmail],
      subject: `🛒 New Order — #${orderDetails.orderId.slice(0, 8).toUpperCase()} | ${storeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#1a1a1a;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">🛒 New Order Received</h1>
                      <p style="margin:8px 0 0 0;color:#a0a0a0;font-size:14px;">${storeName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 40px;">
                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Order ID</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:18px;font-weight:600;font-family:monospace;">#${orderDetails.orderId.slice(0, 8).toUpperCase()}</p>

                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Amount</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:28px;font-weight:700;">${formattedAmount}</p>

                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Products</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:15px;line-height:1.5;">${productList}</p>

                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Customer</p>
                      <p style="margin:0;color:#1a1a1a;font-size:15px;"><strong>${orderDetails.customerName}</strong></p>
                      <p style="margin:4px 0 0 0;color:#666;font-size:14px;">${orderDetails.customerEmail}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 40px 32px 40px;text-align:center;">
                      <a href="http://localhost:3000/dashboard/${storeSlug}/orders" 
                         style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:500;">
                        View Order in Dashboard
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;">
                      <p style="margin:0;color:#999;font-size:12px;">You're receiving this because you own a store on Hookit.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log("✅ Store owner email sent successfully:", result);
  } catch (err: any) {
    console.error("❌ Failed to send store owner email:", err.message, err);
  }
}

async function sendCustomerConfirmationEmail(
  toEmail: string,
  storeName: string,
  storeSlug: string,
  orderDetails: {
    orderId: string;
    customerName: string;
    totalAmount: number;
    productNames: string[];
    currency: string;
  }
) {
  console.log("📧 Attempting to send customer confirmation email to:", toEmail);

  const resendClient = getResend();
  if (!resendClient) {
    console.error("❌ RESEND_API_KEY not set or Resend not initialized");
    return;
  }

  const productList = orderDetails.productNames.join(", ");
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: orderDetails.currency || "INR",
  }).format(orderDetails.totalAmount);

  try {
    const result = await resendClient.emails.send({
      from: "Hookit <orders@hookit.online>",
      to: [toEmail],
      subject: `✅ Order Confirmed — #${orderDetails.orderId.slice(0, 8).toUpperCase()} | ${storeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#1a1a1a;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">✅ Order Confirmed</h1>
                      <p style="margin:8px 0 0 0;color:#a0a0a0;font-size:14px;">${storeName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 40px;">
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:15px;line-height:1.6;">Hi <strong>${orderDetails.customerName}</strong>,</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:15px;line-height:1.6;">Good news! The store owner has been notified about your order. You'll receive an update once your order is processed.</p>

                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Order ID</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:18px;font-weight:600;font-family:monospace;">#${orderDetails.orderId.slice(0, 8).toUpperCase()}</p>

                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Amount Paid</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:28px;font-weight:700;">${formattedAmount}</p>

                      <p style="margin:0 0 8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Products</p>
                      <p style="margin:0 0 24px 0;color:#1a1a1a;font-size:15px;line-height:1.5;">${productList}</p>

                      <div style="background-color:#f8f8f8;border-radius:8px;padding:20px;margin:24px 0;">
                        <p style="margin:0 0 8px 0;color:#666;font-size:13px;">📧 What happens next?</p>
                        <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:1.6;">The store owner will review your order and prepare it for delivery. You'll receive whatsapp notification once your order is shipped or ready for pickup.</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 40px 32px 40px;text-align:center;">
                      <a href="https://${storeSlug}.hookit.online" 
                         style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:500;">
                        Visit Store
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;">
                      <p style="margin:0 0 4px 0;color:#999;font-size:12px;">This email was sent by Hookit on behalf of ${storeName}.</p>
                      <p style="margin:0;color:#999;font-size:12px;">Questions? Contact the store owner directly.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log("✅ Customer confirmation email sent successfully:", result);
  } catch (err: any) {
    console.error("❌ Failed to send customer confirmation email:", err.message, err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      store_slug,
    } = body;

    console.log("🔍 Payment verification started:", { order_id, store_slug });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id || !store_slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // 1. Get store with contact_email
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, slug, contact_email")
      .eq("slug", store_slug)
      .single();

    console.log("🏪 Store lookup:", { store, error: storeError?.message });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { data: paymentSettings } = await supabase
      .from("payment_settings")
      .select("razorpay_key_secret, test_mode, currency")
      .eq("store_id", store.id)
      .single();

    if (!paymentSettings?.razorpay_key_secret) {
      return NextResponse.json(
        { error: "Payment not configured for this store" },
        { status: 400 }
      );
    }

    // 2. Verify signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", paymentSettings.razorpay_key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 3. Update order as PAID
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_order_id,
        razorpay_payment_id,
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("store_id", store.id);

    if (updateError) {
      console.error("Order update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    // 4. Fetch order details for email
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, total_price)")
      .eq("id", order_id)
      .single();

    console.log("📦 Order data:", { orderData, error: orderError?.message });
    console.log("📧 Store contact_email:", store.contact_email);

    // 5. Send notification email to store owner
    if (store.contact_email && orderData) {
      const productNames = orderData.order_items?.map((item: any) => 
        `${item.product_name} (x${item.quantity})`
      ) || [];

      console.log("📧 Sending store owner email with products:", productNames);

      await sendOrderNotificationEmail(
        store.contact_email,
        store.name,
        store.slug,
        {
          orderId: order_id,
          customerName: orderData.customer_name,
          customerEmail: orderData.customer_email,
          totalAmount: orderData.total_amount,
          productNames,
          currency: paymentSettings.currency || "INR",
        }
      );
    } else {
      console.warn("⚠️ Skipping store owner email — contact_email missing or orderData null");
    }

    // 6. Send confirmation email to customer
    if (orderData?.customer_email && orderData) {
      const productNames = orderData.order_items?.map((item: any) => 
        `${item.product_name} (x${item.quantity})`
      ) || [];

      console.log("📧 Sending customer confirmation email to:", orderData.customer_email);

      await sendCustomerConfirmationEmail(
        orderData.customer_email,
        store.name,
        store.slug,
        {
          orderId: order_id,
          customerName: orderData.customer_name,
          totalAmount: orderData.total_amount,
          productNames,
          currency: paymentSettings.currency || "INR",
        }
      );
    } else {
      console.warn("⚠️ Skipping customer email — customer_email missing or orderData null");
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}