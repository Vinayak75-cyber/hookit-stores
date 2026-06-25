// components/dashboard/mobile-sidebar-toggle.tsx
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[#f5f5f5] transition-colors"
      >
        <Menu className="w-5 h-5 text-[#1a1a1a]" />
      </button>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* The sidebar state is controlled via CSS classes on the aside element */}
      <style jsx global>{`
        #mobile-sidebar {
          transform: ${isOpen ? 'translateX(0)' : ''};
        }
      `}</style>
    </>
  );
}