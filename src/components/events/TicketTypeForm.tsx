"use client";

import { useState } from "react";
import {
  Loader2,
  Save,
  Tag,
  IndianRupee,
  Users,
  CalendarClock,
  AlertCircle,
} from "lucide-react";

interface TicketTypeFormProps {
  eventId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function TicketTypeForm({
  eventId,
  onSave,
  onCancel,
  initialData,
}: TicketTypeFormProps) {
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    quantity_total: initialData?.quantity_total?.toString() || "",
    max_per_booking: initialData?.max_per_booking?.toString() || "10",
    sale_start: initialData?.sale_start
      ? new Date(initialData.sale_start).toISOString().slice(0, 16)
      : "",
    sale_end: initialData?.sale_end
      ? new Date(initialData.sale_end).toISOString().slice(0, 16)
      : "",
    is_active: initialData?.is_active ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.name.trim()) {
      setError("Ticket name is required");
      setSaving(false);
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setError("Valid price is required");
      setSaving(false);
      return;
    }

    const quantity = parseInt(form.quantity_total);
    if (isNaN(quantity) || quantity < 1) {
      setError("Valid quantity is required");
      setSaving(false);
      return;
    }

    const maxPerBooking = parseInt(form.max_per_booking);
    if (isNaN(maxPerBooking) || maxPerBooking < 1) {
      setError("Valid max per booking is required");
      setSaving(false);
      return;
    }

    const payload = {
      event_id: eventId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      quantity_total: quantity,
      max_per_booking: maxPerBooking,
      sale_start: form.sale_start || null,
      sale_end: form.sale_end || null,
      is_active: form.is_active,
    };

    try {
      const url = isEditing
        ? `/api/event-ticket-types/${initialData.id}`
        : "/api/event-ticket-types";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save ticket type");
        setSaving(false);
        return;
      }

      onSave(data.data);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
          Ticket Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., General Entry, VIP, Early Bird"
            required
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
          Description
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="What's included with this ticket..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              placeholder="0"
              required
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Total Quantity <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="number"
              min="1"
              value={form.quantity_total}
              onChange={(e) => handleChange("quantity_total", e.target.value)}
              placeholder="100"
              required
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
          Max Tickets Per Booking
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={form.max_per_booking}
          onChange={(e) => handleChange("max_per_booking", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Sale Start
          </label>
          <div className="relative">
            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="datetime-local"
              value={form.sale_start}
              onChange={(e) => handleChange("sale_start", e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Sale End
          </label>
          <div className="relative">
            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="datetime-local"
              value={form.sale_end}
              onChange={(e) => handleChange("sale_end", e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => handleChange("is_active", e.target.checked)}
          className="w-4 h-4 rounded border-[#e5e5e5] text-[#1a1a1a] focus:ring-[#1a1a1a]"
        />
        <label htmlFor="is_active" className="text-sm text-[#1a1a1a]">
          Active (visible for booking)
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1a1a1a] text-white hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Update" : "Add Ticket"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}