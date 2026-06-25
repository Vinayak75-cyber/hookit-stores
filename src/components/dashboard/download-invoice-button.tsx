"use client";

import { Download } from "lucide-react";
import { downloadInvoice } from "./invoice-pdf";

interface Props {
  order: any;
  storeName: string;
  storeSlug: string;
}

export function DownloadInvoiceButton({ order, storeName, storeSlug }: Props) {
  const handleDownload = () => {
    const items = (order.order_items || []).map((item: any) => ({
      name: item.products?.name || item.product_name || "Unknown Product",
      quantity: item.quantity || 1,
      price: item.unit_price || item.total_price / (item.quantity || 1) || 0,
      total: item.total_price || 0,
    }));

    downloadInvoice({
      orderId: order.id,
      storeName,
      storeSlug,
      customerName: order.customer_name || "Guest",
      customerEmail: order.customer_email || "",
      customerPhone: order.customer_phone || "",
      customerAddress: order.customer_address || "",
      items,
      subtotal: order.subtotal || 0,
      shipping: order.shipping_fee || 0,
      additionalFee: order.additional_fee || 0,
      platformFee: order.platform_fee || 0,
      gstAmount: order.gst_amount || 0,
      customFieldsTotal: order.custom_fields_total || 0,
      total: order.total_amount || 0,
      date: order.created_at,
    });
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#666666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors border border-[#e5e5e5]"
    >
      <Download className="w-4 h-4" />
      Download invoice
    </button>
  );
}