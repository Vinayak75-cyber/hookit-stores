"use client";

import { useState } from "react";
import { Menu, Store } from "lucide-react";
import { SidebarNav, MobileSidebarDrawer } from "./sidebar-nav";

export function MobileSidebarWrapper({
  storeSlug,
  storeName,
}: {
  storeSlug: string;
  storeName: string;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#e5e5e5] flex-col z-30">
        <div className="p-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">{storeName}</p>
              <p className="text-xs text-[#888888]">{storeSlug}.hookit.online</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-3 overflow-y-auto flex flex-col">
          <SidebarNav storeSlug={storeSlug} />
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-[#e5e5e5]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f5f5] transition-colors"
            >
              <Menu className="w-5 h-5 text-[#1a1a1a]" />
            </button>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">{storeName}</p>
              <p className="text-xs text-[#888888]">{storeSlug}.hookit.online</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileSidebarDrawer
        storeSlug={storeSlug}
        storeName={storeName}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}