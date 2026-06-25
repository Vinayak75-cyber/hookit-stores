"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import {
  Upload,
  X,
  Star,
  Loader2,
  ImageIcon,
  GripVertical,
} from "lucide-react";

interface Poster {
  id: string;
  image_url: string;
  display_order: number;
  is_main: boolean;
}

interface EventPosterUploaderProps {
  eventId: string;
  posters: Poster[];
  onUpdate: () => void;
}

export default function EventPosterUploader({
  eventId,
  posters,
  onUpdate,
}: EventPosterUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      // Upload to existing R2 bucket (reuse your upload system)
      const fileExt = file.name.split(".").pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;
      const filePath = `event-posters/${fileName}`;

      try {
        // Upload via your existing upload API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "event-posters");
        formData.append("fileName", fileName);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.url) {
          console.error("Upload failed:", uploadData);
          continue;
        }

        // Save to event_posters table
        const isFirstPoster = posters.length === 0;
        await supabase.from("event_posters").insert({
          event_id: eventId,
          image_url: uploadData.url,
          display_order: posters.length,
          is_main: isFirstPoster,
        });
      } catch (err) {
        console.error("Error uploading poster:", err);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onUpdate();
  };

  const handleDelete = async (posterId: string) => {
    setDeleting(posterId);
    await supabase.from("event_posters").delete().eq("id", posterId);
    setDeleting(null);
    onUpdate();
  };

  const handleSetMain = async (posterId: string) => {
    // Unset all others
    await supabase
      .from("event_posters")
      .update({ is_main: false })
      .eq("event_id", eventId);

    // Set this one as main
    await supabase
      .from("event_posters")
      .update({ is_main: true })
      .eq("id", posterId);

    onUpdate();
  };

  const sortedPosters = [...posters].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#999999]" />
          Event Posters
        </h3>
        <span className="text-xs text-[#888888]">
          {posters.length} poster{posters.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center cursor-pointer hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all mb-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="w-12 h-12 bg-[#f5f5f5] rounded-xl flex items-center justify-center mx-auto mb-3">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#666666] animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-[#666666]" />
          )}
        </div>
        <p className="text-sm font-medium text-[#1a1a1a]">
          {uploading ? "Uploading..." : "Click to upload posters"}
        </p>
        <p className="text-xs text-[#888888] mt-1">
          JPG, PNG, WEBP up to 5MB each
        </p>
      </div>

      {/* Posters Grid */}
      {sortedPosters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sortedPosters.map((poster) => (
            <div
              key={poster.id}
              className={`relative group rounded-xl overflow-hidden border-2 ${
                poster.is_main
                  ? "border-[#1a1a1a]"
                  : "border-transparent hover:border-[#e5e5e5]"
              }`}
            >
              <img
                src={poster.image_url}
                alt="Event poster"
                className="w-full aspect-[3/4] object-cover"
              />

              {/* Main badge */}
              {poster.is_main && (
                <div className="absolute top-2 left-2 bg-[#1a1a1a] text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Main
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!poster.is_main && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetMain(poster.id);
                    }}
                    className="px-3 py-1.5 bg-white text-[#1a1a1a] text-xs font-medium rounded-lg hover:bg-[#f5f5f5] transition-colors"
                  >
                    Set as Main
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(poster.id);
                  }}
                  disabled={deleting === poster.id}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting === poster.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ImageIcon className="w-10 h-10 text-[#cccccc] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">No posters uploaded yet</p>
          <p className="text-xs text-[#bbbbbb] mt-1">
            Upload at least one poster to publish your event
          </p>
        </div>
      )}
    </div>
  );
}