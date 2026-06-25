"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

interface WhatsAppNotifyButtonProps {
  customerPhone: string;
  customerName: string;
  orderId: string;
  orderStatus: string;
  storeName: string;
  productNames: string[];
  totalAmount: number;
  trackingNumber?: string;
}

export function WhatsAppNotifyButton({
  customerPhone,
  customerName,
  orderId,
  orderStatus,
  storeName,
  productNames,
  totalAmount,
  trackingNumber,
}: WhatsAppNotifyButtonProps) {
  const [showModal, setShowModal] = useState(false);

  // Format phone: remove + and spaces, ensure country code
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, "").replace(/^\+/, "");
    if (cleaned.startsWith("0")) {
      return "91" + cleaned.slice(1);
    }
    if (!cleaned.startsWith("91") && cleaned.length === 10) {
      return "91" + cleaned;
    }
    return cleaned;
  };

  const getStatusMessage = () => {
    const shortId = orderId.slice(0, 8).toUpperCase();
    const products = productNames.join(", ");
    const amount = `₹${totalAmount.toLocaleString("en-IN")}`;

    switch (orderStatus) {
      case "confirmed":
        return `Hi ${customerName}, your order #${shortId} has been confirmed! 🎉\n\nProducts: ${products}\nAmount: ${amount}\n\nWe'll update you once it's shipped. Thank you for shopping with ${storeName}!`;
      
      case "shipped":
        const tracking = trackingNumber ? `\nTrack: ${trackingNumber}` : "";
        return `Hi ${customerName}, your order #${shortId} has been shipped! 🚚${tracking}\n\nProducts: ${products}\nAmount: ${amount}\n\nExpected delivery soon. Thank you for shopping with ${storeName}!`;
      
      case "delivered":
        return `Hi ${customerName}, your order #${shortId} has been delivered! ✅\n\nProducts: ${products}\nAmount: ${amount}\n\nWe hope you love it! Please share your feedback. Thank you for shopping with ${storeName}!`;
      
      case "cancelled":
        return `Hi ${customerName}, your order #${shortId} has been cancelled. ❌\n\nProducts: ${products}\nAmount: ${amount}\n\nRefund will be processed in 5-7 business days. Sorry for the inconvenience. - ${storeName}`;
      
      default:
        return `Hi ${customerName}, your order #${shortId} status has been updated to ${orderStatus}.\n\nProducts: ${products}\nAmount: ${amount}\n\n- ${storeName}`;
    }
  };

  const whatsappUrl = () => {
    const phone = formatPhone(customerPhone);
    const message = encodeURIComponent(getStatusMessage());
    return `https://wa.me/${phone}?text=${message}`;
  };

  const handleOpen = () => {
    setShowModal(true);
  };

  const handleSend = () => {
    window.open(whatsappUrl(), "_blank");
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
        title="Notify customer via WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        Notify
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#999999] hover:text-[#1a1a1a]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Notify Customer</h3>
              <p className="text-sm text-[#888888] mt-1">
                Send WhatsApp update to {customerName}
              </p>
            </div>

            <div className="bg-[#f8f8f8] rounded-xl p-4 mb-6">
              <p className="text-xs text-[#888888] uppercase tracking-wide mb-2">Message Preview</p>
              <p className="text-sm text-[#1a1a1a] whitespace-pre-line leading-relaxed">
                {getStatusMessage()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[#666666] border border-[#e5e5e5] hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}