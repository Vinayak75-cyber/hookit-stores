"use client";

import { useState } from "react";
import { User, Mail, Phone, AlertCircle } from "lucide-react";

interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  loading?: boolean;
  error?: string;
}

export default function BookingForm({
  onSubmit,
  loading = false,
  error = "",
}: BookingFormProps) {
  const [form, setForm] = useState<BookingFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });

  const [validationError, setValidationError] = useState("");

  const handleChange = (field: keyof BookingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!form.customerName.trim()) {
      setValidationError("Please enter your name");
      return;
    }
    if (!form.customerPhone.trim()) {
      setValidationError("Please enter your phone number");
      return;
    }

    onSubmit(form);
  };

  const inputClass =
    "w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || validationError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || validationError}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            value={form.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            placeholder="Enter your name"
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) => handleChange("customerEmail", e.target.value)}
            placeholder="your@email.com"
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
          Phone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => handleChange("customerPhone", e.target.value)}
            placeholder="+91 98765 43210"
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Processing..." : "Continue to Payment"}
      </button>
    </form>
  );
}