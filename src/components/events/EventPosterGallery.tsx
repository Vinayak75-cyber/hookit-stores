"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface Poster {
  id: string;
  image_url: string;
  is_main: boolean;
}

interface EventPosterGalleryProps {
  posters: Poster[];
  aspectRatio?: "square" | "portrait" | "landscape" | "video";
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  className?: string;
}

export default function EventPosterGallery({
  posters,
  aspectRatio = "portrait",
  showDots = true,
  showArrows = true,
  className = "",
}: EventPosterGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedPosters = [...posters].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return 0;
  });

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[16/9]",
    video: "aspect-video",
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedPosters.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + sortedPosters.length) % sortedPosters.length
    );
  };

  if (posters.length === 0) {
    return (
      <div
        className={`bg-[#f5f5f5] rounded-2xl flex items-center justify-center ${aspectClasses[aspectRatio]} ${className}`}
      >
        <div className="text-center">
          <ImageIcon className="w-10 h-10 text-[#cccccc] mx-auto mb-2" />
          <p className="text-xs text-[#888888]">No posters</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div className={`relative ${aspectClasses[aspectRatio]} bg-[#f5f5f5]`}>
        <img
          src={sortedPosters[currentIndex]?.image_url}
          alt={`Poster ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Main badge */}
        {sortedPosters[currentIndex]?.is_main && (
          <div className="absolute top-3 left-3 bg-[#1a1a1a] text-white text-xs font-medium px-2.5 py-1 rounded-lg">
            Main Poster
          </div>
        )}
      </div>

      {/* Arrows */}
      {showArrows && sortedPosters.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#1a1a1a]" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[#1a1a1a]" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && sortedPosters.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sortedPosters.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-white w-5" : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {sortedPosters.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {sortedPosters.map((poster, i) => (
            <button
              key={poster.id}
              onClick={() => setCurrentIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === currentIndex
                  ? "border-[#1a1a1a]"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={poster.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}