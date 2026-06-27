// components/ImageUploader.tsx
"use client";

import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";

interface ImageUploaderProps {
  type: "logo" | "banner" | "product";
  onUpload: (url: string) => void;
  currentUrl?: string;
}

export default function ImageUploader({ type, onUpload, currentUrl }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File too large. Max 10MB");
      }

      // Compression options based on type
      const options = {
        logo: { maxWidthOrHeight: 400, useWebWorker: true, maxSizeMB: 0.5 },
        banner: { maxWidthOrHeight: 1920, useWebWorker: true, maxSizeMB: 1 },
        product: { maxWidthOrHeight: 1200, useWebWorker: true, maxSizeMB: 1 },
      }[type];

      // Compress in browser
      const compressedFile = await imageCompression(file, options);

      // Create unique filename
      const ext = compressedFile.name.split(".").pop() || "webp";
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${type}/${timestamp}-${random}.${ext}`;

      // Upload to API
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("fileName", fileName);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [type, onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#e5e5e5] rounded-2xl p-6 text-center hover:border-[#1a1a1a] transition-colors cursor-pointer"
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
          id={`upload-${type}`}
        />
        <label htmlFor={`upload-${type}`} className="cursor-pointer block">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#1a1a1a] rounded-full animate-spin" />
              <span className="text-sm text-[#999999]">Uploading...</span>
            </div>
          ) : currentUrl ? (
            <div className="relative">
              <img
                src={currentUrl}
                alt="Preview"
                className={`mx-auto rounded-xl object-cover ${
                  type === "logo" ? "w-24 h-24" : type === "banner" ? "w-full h-32" : "w-full h-48"
                }`}
              />
              <span className="text-sm text-[#999999] mt-2 block">Click or drag to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#999999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm text-[#999999]">Click or drag image here</span>
              <span className="text-xs text-[#cccccc]">
                {type === "logo" ? "400×400px, PNG or JPG" : type === "banner" ? "1200×400px, PNG or JPG" : "Max 10MB"}
              </span>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}