"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  IndianRupee,
  Loader2,
  AlertCircle,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import TicketTypeForm from "./TicketTypeForm";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_booking: number;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
  created_at: string;
}

interface TicketManagerProps {
  eventId: string;
  ticketTypes: TicketType[];
  onUpdate: () => void;
}

export default function TicketManager({
  eventId,
  ticketTypes,
  onUpdate,
}: TicketManagerProps) {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleSave = () => {
    setShowForm(false);
    setEditingTicket(null);
    onUpdate();
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket type?")) return;

    setDeleting(ticketId);
    await supabase.from("event_ticket_types").delete().eq("id", ticketId);
    setDeleting(null);
    onUpdate();
  };

  const handleToggleActive = async (ticket: TicketType) => {
    setToggling(ticket.id);
    await supabase
      .from("event_ticket_types")
      .update({ is_active: !ticket.is_active })
      .eq("id", ticket.id);
    setToggling(null);
    onUpdate();
  };

  const available = (ticket: TicketType) =>
    ticket.quantity_total - ticket.quantity_sold;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#999999]" />
          Ticket Types
        </h3>
        {!showForm && !editingTicket && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#333333] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Ticket
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingTicket) && (
        <div className="bg-[#f5f5f5] rounded-xl p-5 mb-6">
          <TicketTypeForm
            eventId={eventId}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingTicket(null);
            }}
            initialData={editingTicket || undefined}
          />
        </div>
      )}

      {/* Ticket Types List */}
      {ticketTypes.length === 0 ? (
        <div className="text-center py-10">
          <Ticket className="w-10 h-10 text-[#cccccc] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">No ticket types yet</p>
          <p className="text-xs text-[#bbbbbb] mt-1">
            Add at least one ticket type to publish your event
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ticketTypes.map((ticket) => (
            <div
              key={ticket.id}
              className={`border rounded-xl p-4 transition-all ${
                ticket.is_active
                  ? "border-[#e5e5e5] bg-white"
                  : "border-[#e5e5e5] bg-[#fafafa] opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-[#1a1a1a]">
                      {ticket.name}
                    </h4>
                    {!ticket.is_active && (
                      <span className="px-2 py-0.5 bg-[#e5e5e5] text-[#666666] text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-[#888888] mb-2">
                      {ticket.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-[#666666]" />
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        ₹{ticket.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#666666]" />
                      <span className="text-xs text-[#666666]">
                        {ticket.quantity_sold} / {ticket.quantity_total} sold
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-[#666666]" />
                      <span className="text-xs text-[#666666]">
                        {available(ticket)} available
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ticket.quantity_sold >= ticket.quantity_total
                          ? "bg-red-400"
                          : ticket.quantity_sold / ticket.quantity_total > 0.8
                          ? "bg-orange-400"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (ticket.quantity_sold / ticket.quantity_total) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleToggleActive(ticket)}
                    disabled={toggling === ticket.id}
                    className="p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors"
                    title={ticket.is_active ? "Deactivate" : "Activate"}
                  >
                    {toggling === ticket.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
                    ) : ticket.is_active ? (
                      <ToggleRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-[#cccccc]" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingTicket(ticket)}
                    className="p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-[#666666]" />
                  </button>
                  <button
                    onClick={() => handleDelete(ticket.id)}
                    disabled={deleting === ticket.id}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    {deleting === ticket.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}