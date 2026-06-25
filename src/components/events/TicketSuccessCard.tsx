"use client";

import { Ticket, QrCode, CheckCircle } from "lucide-react";

interface TicketSuccessCardProps {
  ticketCode: string;
  ticketTypeName: string;
  attendeeName?: string;
  index?: number;
  status?: string;
}

export default function TicketSuccessCard({
  ticketCode,
  ticketTypeName,
  attendeeName,
  index = 1,
  status = "active",
}: TicketSuccessCardProps) {
  return (
    <div className="border border-[#e5e5e5] rounded-2xl p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#888888]">Ticket {index}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
          <CheckCircle className="w-3 h-3" />
          {status}
        </span>
      </div>

      <p className="text-sm font-medium text-[#1a1a1a] mb-3">
        {ticketTypeName}
      </p>

      {attendeeName && (
        <p className="text-xs text-[#888888] mb-3">
          {attendeeName}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#888888] mb-1">Ticket Code</p>
          <code className="text-xl font-bold text-[#1a1a1a] tracking-wider font-mono">
            {ticketCode}
          </code>
        </div>

        {/* QR Code placeholder */}
        <div className="w-14 h-14 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
          <QrCode className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Barcode visual */}
      <div className="mt-4 flex gap-0.5 h-8 items-end">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#1a1a1a] flex-1"
            style={{
              height: `${Math.random() * 100}%`,
              minHeight: "20%",
            }}
          />
        ))}
      </div>
    </div>
  );
}