"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  orderId: string;
  storeName: string;
  storeSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  shipping: number;
  additionalFee: number;
  platformFee: number;
  gstAmount: number;
  customFieldsTotal: number;
  total: number;
  date: string;
}

export function downloadInvoice(data: InvoiceData) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(26, 26, 26);
  doc.text("INVOICE", 20, 30);
  
  // Store info
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(data.storeName, 20, 45);
  doc.text(`${data.storeSlug}.hookit.online`, 20, 52);
  
  // Order info (right side)
  doc.setFontSize(10);
  doc.text(`Order ID: #${data.orderId.slice(0, 8).toUpperCase()}`, 140, 45);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString("en-IN")}`, 140, 52);
  
  // Customer info
  doc.setFontSize(12);
  doc.setTextColor(26, 26, 26);
  doc.text("Bill To:", 20, 70);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(data.customerName, 20, 78);
  doc.text(data.customerEmail, 20, 85);
  doc.text(data.customerPhone, 20, 92);
  doc.text(data.customerAddress, 20, 99);
  
  // Items table
  const tableData = data.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `₹${item.price.toLocaleString("en-IN")}`,
    `₹${item.total.toLocaleString("en-IN")}`,
  ]);
  
  autoTable(doc, {
    startY: 110,
    head: [["Product", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [26, 26, 26],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  let currentY = finalY;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  
  // Subtotal
  doc.text("Subtotal", 140, currentY);
  doc.text(`₹${data.subtotal.toLocaleString("en-IN")}`, 180, currentY, { align: "right" });
  currentY += 8;
  
  // Shipping
  if (data.shipping > 0) {
    doc.text("Shipping", 140, currentY);
    doc.text(`₹${data.shipping.toLocaleString("en-IN")}`, 180, currentY, { align: "right" });
    currentY += 8;
  }
  
  // Additional Fee
  if (data.additionalFee > 0) {
    doc.text("Additional Fee", 140, currentY);
    doc.text(`₹${data.additionalFee.toLocaleString("en-IN")}`, 180, currentY, { align: "right" });
    currentY += 8;
  }
  
  // Platform Fee
  if (data.platformFee > 0) {
    doc.text("Platform Fee", 140, currentY);
    doc.text(`₹${data.platformFee.toLocaleString("en-IN")}`, 180, currentY, { align: "right" });
    currentY += 8;
  }
  
  // GST
  if (data.gstAmount > 0) {
    doc.text("GST", 140, currentY);
    doc.text(`₹${data.gstAmount.toLocaleString("en-IN")}`, 180, currentY, { align: "right" });
    currentY += 8;
  }
  
  // Custom Fields
  if (data.customFieldsTotal > 0) {
    doc.text("Custom Options", 140, currentY);
    doc.text(`₹${data.customFieldsTotal.toLocaleString("en-IN")}`, 180, currentY, { align: "right" });
    currentY += 8;
  }
  
  // Total
  doc.setFontSize(12);
  doc.setTextColor(26, 26, 26);
  doc.setFont("helvetica", "bold");
  doc.text("Total", 140, currentY + 8);
  doc.text(`₹${data.total.toLocaleString("en-IN")}`, 180, currentY + 8, { align: "right" });
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by hookit", 105, 280, { align: "center" });
  doc.text("Thank you for your business!", 105, 285, { align: "center" });
  
  doc.save(`invoice-${data.orderId.slice(0, 8)}.pdf`);
}