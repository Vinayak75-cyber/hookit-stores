"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export function ProductImageGallery({ images, productName, borderRadius }: { 
  images: any[]; 
  productName: string; 
  borderRadius: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image - object-contain for original size */}
      <div 
        className="aspect-square overflow-hidden bg-[#f5f5f5] relative" 
        style={{ borderRadius }}
      >
        {images[selectedIndex]?.image_url ? (
          <img 
            src={images[selectedIndex].image_url} 
            alt={productName} 
            className="w-full h-full object-contain" // ← CHANGED: object-cover → object-contain
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-[#cccccc]" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img: any, idx: number) => (
            <div 
              key={img.id} 
              onClick={() => setSelectedIndex(idx)}
              className={`aspect-square overflow-hidden bg-[#f5f5f5] border-2 cursor-pointer transition-all ${
                selectedIndex === idx ? "border-[#1a1a1a]" : "border-transparent hover:border-[#999999]"
              }`}
              style={{ borderRadius }}
            >
              <img 
                src={img.image_url} 
                alt={`${productName} ${idx + 1}`} 
                className="w-full h-full object-cover" 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}