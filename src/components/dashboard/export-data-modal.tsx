"use client";

import { useState } from "react";
import { Download, X, Calendar } from "lucide-react";

interface ExportDataModalProps {
  storeSlug: string;
}

export function ExportDataModal({ storeSlug }: ExportDataModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeType, setRangeType] = useState<"current" | "last" | "custom">("current");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);

    let from: string;
    let to: string;
    const now = new Date();

    if (rangeType === "current") {
      const y = now.getFullYear();
      const m = now.getMonth();
      from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      to = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;
    } else if (rangeType === "last") {
      const y = now.getFullYear();
      const m = now.getMonth() - 1;
      const lastMonth = m < 0 ? 11 : m;
      const lastYear = m < 0 ? y - 1 : y;
      from = `${lastYear}-${String(lastMonth + 1).padStart(2, "0")}-01`;
      to = `${lastYear}-${String(lastMonth + 1).padStart(2, "0")}-${String(new Date(lastYear, lastMonth + 1, 0).getDate()).padStart(2, "0")}`;
    } else {
      from = customFrom;
      to = customTo;
    }

    const url = `/dashboard/${storeSlug}/orders/export?from=${from}&to=${to}`;
    window.open(url, "_blank");

    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-sm text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
      >
        <Download className="w-4 h-4" />
        Export Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Export Orders</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#f5f5f5] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#666666]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[#888888]">
                Choose a date range to export your orders report.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setRangeType("current")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    rangeType === "current"
                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                      : "border-[#e5e5e5] text-[#666666] hover:border-[#1a1a1a]"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Current Month
                </button>

                <button
                  onClick={() => setRangeType("last")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    rangeType === "last"
                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                      : "border-[#e5e5e5] text-[#666666] hover:border-[#1a1a1a]"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Last Month
                </button>

                <button
                  onClick={() => setRangeType("custom")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    rangeType === "custom"
                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                      : "border-[#e5e5e5] text-[#666666] hover:border-[#1a1a1a]"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Custom Range
                </button>
              </div>

              {rangeType === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-[#666666] mb-1.5">
                      From
                    </label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666666] mb-1.5">
                      To
                    </label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e5e5] bg-[#fafafa]">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#f0f0f0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={
                  isLoading ||
                  (rangeType === "custom" && (!customFrom || !customTo))
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1a1a1a] text-white hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export & Print
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}