"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Ticket,
} from "lucide-react";
import Link from "next/link";

interface AttendeeTicket {
  id: string;
  ticket_code: string;
  ticket_type_name: string;
  attendee_name: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

export default function EventAttendeesPage() {
  const params = useParams();
  const eventStoreSlug = params.eventStoreSlug as string;
  const eventId = params.eventId as string;
  const supabase = createClient();

  const [tickets, setTickets] = useState<AttendeeTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  async function loadAttendees() {
    const { data } = await supabase
      .from("event_tickets")
      .select(
        "id, ticket_code, ticket_type_name, attendee_name, status, checked_in, checked_in_at, created_at"
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setTickets(data || []);
    setLoading(false);
  }

  const handleCheckIn = async (ticketId: string) => {
    setCheckingIn(ticketId);
    await supabase
      .from("event_tickets")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", ticketId);
    setCheckingIn(null);
    loadAttendees();
  };

  const handleUndoCheckIn = async (ticketId: string) => {
    setCheckingIn(ticketId);
    await supabase
      .from("event_tickets")
      .update({ checked_in: false, checked_in_at: null })
      .eq("id", ticketId);
    setCheckingIn(null);
    loadAttendees();
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      t.attendee_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_type_name?.toLowerCase().includes(search.toLowerCase())
  );

  const checkedInCount = tickets.filter((t) => t.checked_in).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/event-dashboard/${eventStoreSlug}/events/${eventId}`}
          className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Attendees</h1>
        <p className="text-sm text-[#888888] mt-1">
          Manage guest check-ins and ticket status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">{tickets.length}</p>
          <p className="text-sm text-[#888888] mt-1">Total Attendees</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">{checkedInCount}</p>
          <p className="text-sm text-[#888888] mt-1">Checked In</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">
            {tickets.length - checkedInCount}
          </p>
          <p className="text-sm text-[#888888] mt-1">Not Checked In</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket code, name, or type..."
          className="w-full border border-[#e5e5e5] rounded-xl py-3 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#bbbbbb] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
        />
      </div>

      {/* Attendees Table */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 text-center">
          <Users className="w-10 h-10 text-[#cccccc] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">No attendees yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Ticket Code
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-[#888888] uppercase tracking-wider px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#999999]" />
                      <code className="text-sm font-mono font-medium text-[#1a1a1a]">
                        {ticket.ticket_code}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1a1a1a]">
                      {ticket.attendee_name || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#666666]">
                      {ticket.ticket_type_name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.checked_in ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Checked in
                        {ticket.checked_in_at && (
                          <span className="text-[10px] ml-1 opacity-70">
                            {new Date(ticket.checked_in_at).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f5f5] text-[#666666]">
                        <XCircle className="w-3 h-3" />
                        Not checked in
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ticket.checked_in ? (
                      <button
                        onClick={() => handleUndoCheckIn(ticket.id)}
                        disabled={checkingIn === ticket.id}
                        className="text-xs text-[#666666] hover:text-[#1a1a1a] underline disabled:opacity-50"
                      >
                        {checkingIn === ticket.id ? "..." : "Undo"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(ticket.id)}
                        disabled={checkingIn === ticket.id}
                        className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50"
                      >
                        {checkingIn === ticket.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Check In"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}