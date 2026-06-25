"use client";

import { Minus, Plus, Ticket } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
  max_per_booking: number;
}

interface TicketSelectorProps {
  tickets: TicketType[];
  selectedTickets: Record<string, number>;
  onChange: (ticketId: string, quantity: number) => void;
}

export default function TicketSelector({
  tickets,
  selectedTickets,
  onChange,
}: TicketSelectorProps) {
  const handleQuantityChange = (ticketId: string, delta: number) => {
    const current = selectedTickets[ticketId] || 0;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const newQty = Math.max(
      0,
      Math.min(current + delta, ticket.available, ticket.max_per_booking)
    );
    onChange(ticketId, newQty);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
        <Ticket className="w-4 h-4 text-[#999999]" />
        Select Tickets
      </h3>

      {tickets.length === 0 ? (
        <div className="text-center py-8 bg-[#f5f5f5] rounded-2xl">
          <Ticket className="w-8 h-8 text-[#cccccc] mx-auto mb-2" />
          <p className="text-sm text-[#888888]">No tickets available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const qty = selectedTickets[ticket.id] || 0;
            const soldOut = ticket.available <= 0;

            return (
              <div
                key={ticket.id}
                className={`flex items-center justify-between p-4 border rounded-2xl ${
                  soldOut
                    ? "border-[#e5e5e5] bg-[#fafafa] opacity-50"
                    : "border-[#e5e5e5] bg-white"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {ticket.name}
                  </p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    {soldOut
                      ? "Sold out"
                      : `${ticket.available} left · Max ${ticket.max_per_booking} per booking`}
                  </p>
                  <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                    ₹{ticket.price.toLocaleString("en-IN")}
                  </p>
                </div>

                {!soldOut && (
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => handleQuantityChange(ticket.id, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-[#1a1a1a]" />
                    </button>
                    <span className="text-sm font-semibold text-[#1a1a1a] w-4 text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(ticket.id, 1)}
                      disabled={
                        qty >= ticket.available || qty >= ticket.max_per_booking
                      }
                      className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#1a1a1a]" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}