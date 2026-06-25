"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { ChevronDown, Check } from "lucide-react";

export function OrderStatusDropdown({
  orderId,
  currentStatus,
  storeSlug,
}: {
  orderId: string;
  currentStatus: string;
  storeSlug: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const supabase = createClient();

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (!error) {
      setStatus(newStatus);
      setIsOpen(false);
      window.location.reload();
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "paid", label: "Paid", color: "text-green-600" },
    { value: "shipped", label: "Shipped", color: "text-indigo-600" },
    { value: "delivered", label: "Delivered", color: "text-blue-600" },
    { value: "cancelled", label: "Cancelled", color: "text-red-600" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-[#666666] hover:bg-[#f5f5f5] transition-colors"
      >
        Update
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#e5e5e5] rounded-xl shadow-lg z-20 py-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateStatus(option.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f5f5f5] transition-colors flex items-center justify-between ${
                  status === option.value ? "font-medium" : ""
                } ${option.color}`}
              >
                {option.label}
                {status === option.value && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}