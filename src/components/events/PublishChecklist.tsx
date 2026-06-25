"use client";

import { Check, X } from "lucide-react";

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface PublishChecklistProps {
  items: ChecklistItem[];
  isPublished: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  publishing: boolean;
}

export default function PublishChecklist({
  items,
  isPublished,
  onPublish,
  onUnpublish,
  publishing,
}: PublishChecklistProps) {
  const allCompleted = items.every((item) => item.completed);
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">
          Publish checklist
        </h3>
        <span className="text-xs text-[#888888]">
          {completedCount}/{items.length} completed
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.completed
                  ? "bg-green-500"
                  : "border-2 border-[#e5e5e5]"
              }`}
            >
              {item.completed && <Check className="w-3 h-3 text-white" />}
              {!item.completed && <X className="w-3 h-3 text-[#cccccc]" />}
            </div>
            <span
              className={`text-sm ${
                item.completed
                  ? "text-[#666666] line-through"
                  : "text-[#1a1a1a]"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {isPublished ? (
        <button
          onClick={onUnpublish}
          disabled={publishing}
          className="w-full py-2.5 rounded-xl text-sm font-medium border border-[#e5e5e5] text-[#666666] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
        >
          {publishing ? "Updating..." : "Unpublish event"}
        </button>
      ) : (
        <button
          onClick={onPublish}
          disabled={!allCompleted || publishing}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            allCompleted
              ? "bg-[#1a1a1a] text-white hover:bg-[#333333]"
              : "bg-[#f5f5f5] text-[#999999] cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {publishing
            ? "Publishing..."
            : allCompleted
            ? "Publish event"
            : "Complete checklist to publish"}
        </button>
      )}
    </div>
  );
}