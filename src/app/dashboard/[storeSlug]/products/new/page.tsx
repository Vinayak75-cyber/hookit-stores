"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Package,
  DollarSign,
  FileText,
  Tag,
  Boxes,
  Lock,
  Loader2,
  ImageIcon,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Layers,
  Percent,
  Truck,
  List,
  Settings,
  Eye,
  Globe,
  Hash,
  Sparkles,
} from "lucide-react";

// ==================== TYPES ====================

interface Collection {
  id: string;
  name: string;
}

// ==================== INDEPENDENT SECTION COMPONENTS ====================

function BasicInfoSection({ form, setForm, images, setImages, imagePreviews, setImagePreviews, dragOver, setDragOver, handleImageSelect, removeImage }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group" open>
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Basic Information</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Product name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Premium Cotton T-Shirt"
            required
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your product..."
            rows={4}
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((prev: any) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Clothing"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((prev: any) => ({ ...prev, brand: e.target.value }))}
              placeholder="e.g., Nike"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm((prev: any) => ({ ...prev, sku: e.target.value }))}
              placeholder="e.g., SHIRT-001"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Video URL</label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm((prev: any) => ({ ...prev, video_url: e.target.value }))}
              placeholder="YouTube or Vimeo link"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Product Images</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageSelect(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all ${dragOver ? "border-[#1a1a1a] bg-[#fafafa]" : "border-[#e5e5e5]"}`}
          >
            <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 text-[#999999]" />
            <p className="text-sm text-[#666666]">Drag and drop images or click to browse</p>
            <label className="inline-flex items-center gap-2 mt-3 bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-[#333333]">
              <Upload className="w-4 h-4" />
              Upload
              <input type="file" multiple accept="image/*" onChange={(e) => handleImageSelect(e.target.files)} className="hidden" />
            </label>
          </div>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mt-3">
              {imagePreviews.map((preview: string, index: number) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#f5f5f5] group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function CollectionsSection({ collections, selectedCollections, setSelectedCollections, newCollectionName, setNewCollectionName, showNewCollection, setShowNewCollection, handleCreateCollection }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Collections</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {collections.map((col: Collection) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedCollections((prev: string[]) =>
                prev.includes(col.id) ? prev.filter((id) => id !== col.id) : [...prev, col.id]
              )}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                selectedCollections.includes(col.id)
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "bg-white text-[#666666] border-[#e5e5e5] hover:border-[#1a1a1a]"
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>
        {!showNewCollection ? (
          <button
            type="button"
            onClick={() => setShowNewCollection(true)}
            className="text-sm text-[#1a1a1a] font-medium flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" />
            Create new collection
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="flex-1 border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCollection())}
            />
            <button type="button" onClick={handleCreateCollection} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-sm shrink-0">
              Create
            </button>
            <button type="button" onClick={() => setShowNewCollection(false)} className="text-[#999999] shrink-0 p-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

function PricingSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group" open>
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Pricing</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((prev: any) => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              required
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Compare at price</label>
            <input
              type="number"
              step="0.01"
              value={form.compare_at_price}
              onChange={(e) => setForm((prev: any) => ({ ...prev, compare_at_price: e.target.value }))}
              placeholder="Original price"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Cost price</label>
            <input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => setForm((prev: any) => ({ ...prev, cost_price: e.target.value }))}
              placeholder="Your cost"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
        </div>
      </div>
    </details>
  );
}

function TaxSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Tax Settings</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">GST Mode</label>
          <div className="flex gap-3">
            {(["included", "excluded"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm((prev: any) => ({ ...prev, gst_mode: mode }))}
                className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                  form.gst_mode === mode
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "bg-white text-[#666666] border-[#e5e5e5]"
                }`}
              >
                {mode === "included" ? "GST Included" : "GST Excluded"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">GST %</label>
          <select
            value={form.gst_percentage}
            onChange={(e) => setForm((prev: any) => ({ ...prev, gst_percentage: e.target.value }))}
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm bg-white"
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
      </div>
    </details>
  );
}

function FeesSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Fees & Charges</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Shipping fee</label>
            <input
              type="number"
              step="0.01"
              value={form.shipping_fee}
              onChange={(e) => setForm((prev: any) => ({ ...prev, shipping_fee: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Additional fee</label>
            <input
              type="number"
              step="0.01"
              value={form.additional_fee}
              onChange={(e) => setForm((prev: any) => ({ ...prev, additional_fee: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Platform fee</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={form.platform_fee}
                onChange={(e) => setForm((prev: any) => ({ ...prev, platform_fee: e.target.value }))}
                placeholder="0.00"
                className="flex-1 border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
              />
              <select
                value={form.platform_fee_type}
                onChange={(e) => setForm((prev: any) => ({ ...prev, platform_fee_type: e.target.value }))}
                className="border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-2 text-sm bg-white shrink-0"
              >
                <option value="fixed">₹</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function InventorySection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group" open>
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Inventory</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f8f8]">
          <span className="text-sm font-medium text-[#1a1a1a]">Track inventory</span>
          <button
            type="button"
            onClick={() => setForm((prev: any) => ({ ...prev, track_inventory: !prev.track_inventory }))}
          >
            {form.track_inventory ? (
              <ToggleRight className="w-7 h-7 sm:w-8 sm:h-8 text-[#1a1a1a]" />
            ) : (
              <ToggleLeft className="w-7 h-7 sm:w-8 sm:h-8 text-[#999999]" />
            )}
          </button>
        </div>
        {form.track_inventory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Quantity</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((prev: any) => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Low stock alert</label>
              <input
                type="number"
                value={form.low_stock_alert}
                onChange={(e) => setForm((prev: any) => ({ ...prev, low_stock_alert: e.target.value }))}
                placeholder="5"
                className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.continue_selling}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, continue_selling: e.target.checked }))}
                  className="w-4 h-4 accent-[#1a1a1a]"
                />
                <span className="text-sm text-[#666666]">Continue selling when out of stock</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function VariantsSection({ variantOptions, setVariantOptions, variantCombinations, setVariantCombinations, form }: any) {
  const addVariantOption = () => {
    setVariantOptions((prev: any[]) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", values: [] },
    ]);
  };

  const updateVariantOption = (id: string, name: string, values: string) => {
    setVariantOptions((prev: any[]) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, name, values: values.split(",").map((v: string) => v.trim()).filter(Boolean) } : opt
      )
    );
  };

  const removeVariantOption = (id: string) => {
    setVariantOptions((prev: any[]) => prev.filter((opt) => opt.id !== id));
  };

  const generateVariantCombinations = () => {
    const validOptions = variantOptions.filter((o: any) => o.name && o.values.length > 0);
    if (validOptions.length === 0) return;

    const generateCombos = (options: any[], index: number, current: Record<string, string>): any[] => {
      if (index === options.length) {
        return [{
          id: crypto.randomUUID(),
          options: { ...current },
          price: form.price || "",
          compare_price: "",
          quantity: form.stock || "",
          sku: "",
        }];
      }
      const results: any[] = [];
      for (const value of options[index].values) {
        results.push(...generateCombos(options, index + 1, { ...current, [options[index].name]: value }));
      }
      return results;
    };

    setVariantCombinations(generateCombos(validOptions, 0, {}));
  };

  const updateVariantCombo = (id: string, field: string, value: string) => {
    setVariantCombinations((prev: any[]) =>
      prev.map((combo) => (combo.id === id ? { ...combo, [field]: value } : combo))
    );
  };

  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Product Variants</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-4">
        {variantOptions.map((option: any) => (
          <div key={option.id} className="p-3 sm:p-4 rounded-xl bg-[#f8f8f8] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={option.name}
                onChange={(e) => updateVariantOption(option.id, e.target.value, option.values.join(", "))}
                placeholder="Option name (e.g., Size)"
                className="flex-1 border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm bg-white"
              />
              <button type="button" onClick={() => removeVariantOption(option.id)} className="text-red-500 shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={option.values.join(", ")}
              onChange={(e) => updateVariantOption(option.id, option.name, e.target.value)}
              placeholder="Values separated by commas"
              className="w-full border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm bg-white"
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button type="button" onClick={addVariantOption} className="flex items-center gap-1 text-sm text-[#1a1a1a] font-medium hover:underline">
            <Plus className="w-4 h-4" />
            Add option
          </button>
          {variantOptions.length > 0 && (
            <button type="button" onClick={generateVariantCombinations} className="flex items-center gap-1 text-sm text-[#1a1a1a] font-medium hover:underline">
              <Sparkles className="w-4 h-4" />
              Generate combinations
            </button>
          )}
        </div>
        {variantCombinations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#1a1a1a]">Variant combinations</p>
            {variantCombinations.map((combo: any) => (
              <div key={combo.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-white border border-[#e5e5e5]">
                <div className="sm:col-span-2 text-sm text-[#666666] truncate">
                  {Object.entries(combo.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                </div>
                <input
                  type="number"
                  placeholder="Price"
                  value={combo.price}
                  onChange={(e) => updateVariantCombo(combo.id, "price", e.target.value)}
                  className="border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={combo.quantity}
                  onChange={(e) => updateVariantCombo(combo.id, "quantity", e.target.value)}
                  className="border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={combo.sku}
                  onChange={(e) => updateVariantCombo(combo.id, "sku", e.target.value)}
                  className="border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function ShippingSection({ form, setForm }: any) {
  if (form.is_digital) return null;
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Shipping</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={form.weight}
              onChange={(e) => setForm((prev: any) => ({ ...prev, weight: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Length (cm)</label>
            <input
              type="number"
              step="0.01"
              value={form.length}
              onChange={(e) => setForm((prev: any) => ({ ...prev, length: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Width (cm)</label>
            <input
              type="number"
              step="0.01"
              value={form.width}
              onChange={(e) => setForm((prev: any) => ({ ...prev, width: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Height (cm)</label>
            <input
              type="number"
              step="0.01"
              value={form.height}
              onChange={(e) => setForm((prev: any) => ({ ...prev, height: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
        </div>
      </div>
    </details>
  );
}

function SpecificationsSection({ specifications, setSpecifications }: any) {
  const addSpecification = () => {
    setSpecifications((prev: any[]) => [...prev, { id: crypto.randomUUID(), key: "", value: "" }]);
  };

  const updateSpecification = (id: string, field: "key" | "value", value: string) => {
    setSpecifications((prev: any[]) =>
      prev.map((spec) => (spec.id === id ? { ...spec, [field]: value } : spec))
    );
  };

  const removeSpecification = (id: string) => {
    setSpecifications((prev: any[]) => prev.filter((spec) => spec.id !== id));
  };

  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <List className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Specifications</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-2">
        {specifications.map((spec: any) => (
          <div key={spec.id} className="flex items-center gap-2">
            <input
              type="text"
              value={spec.key}
              onChange={(e) => updateSpecification(spec.id, "key", e.target.value)}
              placeholder="Key (e.g., Material)"
              className="flex-1 border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm"
            />
            <input
              type="text"
              value={spec.value}
              onChange={(e) => updateSpecification(spec.id, "value", e.target.value)}
              placeholder="Value (e.g., Cotton)"
              className="flex-1 border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm"
            />
            <button type="button" onClick={() => removeSpecification(spec.id)} className="text-red-500 shrink-0 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addSpecification} className="flex items-center gap-1 text-sm text-[#1a1a1a] font-medium hover:underline">
          <Plus className="w-4 h-4" />
          Add specification
        </button>
      </div>
    </details>
  );
}

function CustomFieldsSection({ customFields, setCustomFields }: any) {
  const addCustomField = () => {
    setCustomFields((prev: any[]) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", field_type: "text", is_required: false, char_limit: "", additional_price: "" },
    ]);
  };

  const updateCustomField = (id: string, field: string, value: any) => {
    setCustomFields((prev: any[]) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev: any[]) => prev.filter((f) => f.id !== id));
  };

  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Custom Options</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-3">
        {customFields.map((field: any) => (
          <div key={field.id} className="p-3 sm:p-4 rounded-xl bg-[#f8f8f8] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                placeholder="Field label (e.g., Custom Name)"
                className="flex-1 border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm bg-white"
              />
              <select
                value={field.field_type}
                onChange={(e) => updateCustomField(field.id, "field_type", e.target.value)}
                className="border border-[#e5e5e5] rounded-xl py-2 px-2 sm:px-3 text-sm bg-white shrink-0"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="file">File</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <button type="button" onClick={() => removeCustomField(field.id)} className="text-red-500 shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <label className="flex items-center gap-1 text-sm text-[#666666]">
                <input
                  type="checkbox"
                  checked={field.is_required}
                  onChange={(e) => updateCustomField(field.id, "is_required", e.target.checked)}
                  className="accent-[#1a1a1a]"
                />
                Required
              </label>
              <input
                type="number"
                value={field.char_limit}
                onChange={(e) => updateCustomField(field.id, "char_limit", e.target.value)}
                placeholder="Char limit"
                className="w-20 sm:w-24 border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm bg-white"
              />
              <input
                type="number"
                step="0.01"
                value={field.additional_price}
                onChange={(e) => updateCustomField(field.id, "additional_price", e.target.value)}
                placeholder="Extra price"
                className="w-24 sm:w-28 border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm bg-white"
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addCustomField} className="flex items-center gap-1 text-sm text-[#1a1a1a] font-medium hover:underline">
          <Plus className="w-4 h-4" />
          Add custom field
        </button>
      </div>
    </details>
  );
}

function DigitalSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group relative">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Digital Product</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f8f8]">
          <span className="text-sm font-medium text-[#1a1a1a]">This is a digital product</span>
          <button
            type="button"
            onClick={() => setForm((prev: any) => ({ ...prev, is_digital: !prev.is_digital }))}
          >
            {form.is_digital ? (
              <ToggleRight className="w-7 h-7 sm:w-8 sm:h-8 text-[#1a1a1a]" />
            ) : (
              <ToggleLeft className="w-7 h-7 sm:w-8 sm:h-8 text-[#999999]" />
            )}
          </button>
        </div>
        {form.is_digital && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Download URL</label>
              <input
                type="url"
                value={form.digital_file_url}
                onChange={(e) => setForm((prev: any) => ({ ...prev, digital_file_url: e.target.value }))}
                placeholder="File download link"
                className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Download limit</label>
              <input
                type="number"
                value={form.digital_download_limit}
                onChange={(e) => setForm((prev: any) => ({ ...prev, digital_download_limit: e.target.value }))}
                placeholder="0 = unlimited"
                className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Upgrade to Pro Overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10 rounded-2xl">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <p className="text-sm font-semibold text-[#1a1a1a]">Upgrade to Pro</p>
        <p className="text-xs text-[#999999]">Unlock digital products</p>
      </div>
    </details>
  );
}

function SeoSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group relative">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">SEO Settings</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Meta title</label>
          <input
            type="text"
            value={form.meta_title}
            onChange={(e) => setForm((prev: any) => ({ ...prev, meta_title: e.target.value }))}
            placeholder="SEO title"
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Meta description</label>
          <textarea
            value={form.meta_description}
            onChange={(e) => setForm((prev: any) => ({ ...prev, meta_description: e.target.value }))}
            placeholder="SEO description"
            rows={2}
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">URL slug</label>
          <input
            type="text"
            value={form.url_slug}
            onChange={(e) => setForm((prev: any) => ({ ...prev, url_slug: e.target.value }))}
            placeholder="product-url-slug"
            className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
          />
        </div>
      </div>

      {/* Upgrade to Pro Overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10 rounded-2xl">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <p className="text-sm font-semibold text-[#1a1a1a]">Upgrade to Pro</p>
        <p className="text-xs text-[#999999]">Unlock SEO settings</p>
      </div>
    </details>
  );
}

function VisibilitySection({ form, setForm }: any) {
  const options = ["active", "draft", "hidden"] as const;

  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group" open>
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Visibility</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5">
        <div className="flex gap-2 sm:gap-3">
          {options.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm((prev: any) => ({ ...prev, visibility: v }))}
              className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border transition-all capitalize ${
                form.visibility === v
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "bg-white text-[#666666] border-[#e5e5e5]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

function PurchaseLimitsSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Hash className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Purchase Limits</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#f0f0f0] pt-4 sm:pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Minimum quantity</label>
            <input
              type="number"
              value={form.min_quantity}
              onChange={(e) => setForm((prev: any) => ({ ...prev, min_quantity: e.target.value }))}
              placeholder="1"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Maximum quantity</label>
            <input
              type="number"
              value={form.max_quantity}
              onChange={(e) => setForm((prev: any) => ({ ...prev, max_quantity: e.target.value }))}
              placeholder="No limit"
              className="w-full border border-[#e5e5e5] rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm"
            />
          </div>
        </div>
      </div>
    </details>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function AddProductPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [storeSlug, setStoreSlug] = useState<string>("");

  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    category: string;
    brand: string;
    video_url: string;
    sku: string;
    price: string;
    compare_at_price: string;
    cost_price: string;
    gst_mode: "included" | "excluded";
    gst_percentage: string;
    shipping_fee: string;
    additional_fee: string;
    platform_fee: string;
    platform_fee_type: "fixed" | "percentage";
    track_inventory: boolean;
    stock: string;
    low_stock_alert: string;
    continue_selling: boolean;
    is_digital: boolean;
    digital_file_url: string;
    digital_download_limit: string;
    min_quantity: string;
    max_quantity: string;
    visibility: "active" | "draft" | "hidden";
    meta_title: string;
    meta_description: string;
    url_slug: string;
    weight: string;
    length: string;
    width: string;
    height: string;
  }>({
    name: "",
    description: "",
    category: "",
    brand: "",
    video_url: "",
    sku: "",
    price: "",
    compare_at_price: "",
    cost_price: "",
    gst_mode: "included",
    gst_percentage: "0",
    shipping_fee: "",
    additional_fee: "",
    platform_fee: "",
    platform_fee_type: "fixed",
    track_inventory: true,
    stock: "",
    low_stock_alert: "5",
    continue_selling: false,
    is_digital: false,
    digital_file_url: "",
    digital_download_limit: "",
    min_quantity: "1",
    max_quantity: "",
    visibility: "draft",
    meta_title: "",
    meta_description: "",
    url_slug: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<any[]>([]);

  const [specifications, setSpecifications] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storeSlug) return;
    fetchCollections();
  }, [storeSlug]);

  const fetchCollections = async () => {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single();
    if (!store) return;
    const res = await fetch(`/api/collections?store_id=${store.id}`);
    const data = await res.json();
    setCollections(data.collections || []);
  };

  const handleImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (newFiles.length === 0) {
      setError("Please upload image files only");
      return;
    }
    if (newFiles.length + images.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }
    const oversized = newFiles.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setError("One or more images exceed 10MB");
      return;
    }
    setImages((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setError("");
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      const imageCompression = (await import("browser-image-compression")).default;
      return await imageCompression(file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 1,
        useWebWorker: true,
        fileType: "image/webp",
      });
    } catch {
      return file;
    }
  };

  const uploadImagesToR2 = async (productId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) throw new Error("Image too large. Max 10MB");

      const compressedFile = await compressImage(file);
      const fileName = `${storeSlug}/${productId}/${Date.now()}-${i}.webp`;
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("fileName", fileName);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !storeSlug) return;
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single();
    if (!store) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.id, name: newCollectionName.trim() }),
    });
    const data = await res.json();
    if (data.collection) {
      setCollections((prev) => [...prev, data.collection]);
      setSelectedCollections((prev) => [...prev, data.collection.id]);
      setNewCollectionName("");
      setShowNewCollection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug) return;
    setUploading(true);
    setError("");

    if (!form.name.trim() || !form.price) {
      setError("Product name and price are required");
      setUploading(false);
      return;
    }

    try {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", storeSlug)
        .single();
      if (!store) {
        setError("Store not found");
        setUploading(false);
        return;
      }

      const payload = {
        store_id: store.id,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim() || null,
        brand: form.brand.trim() || null,
        video_url: form.video_url.trim() || null,
        sku: form.sku.trim() || null,
        price: parseFloat(form.price) || 0,
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        gst_mode: form.gst_mode,
        gst_percentage: parseFloat(form.gst_percentage) || 0,
        shipping_fee: form.shipping_fee ? parseFloat(form.shipping_fee) : 0,
        additional_fee: form.additional_fee ? parseFloat(form.additional_fee) : 0,
        platform_fee: form.platform_fee ? parseFloat(form.platform_fee) : 0,
        platform_fee_type: form.platform_fee_type,
        track_inventory: form.track_inventory,
        stock: form.track_inventory ? (parseInt(form.stock) || 0) : null,
        low_stock_alert: parseInt(form.low_stock_alert) || 5,
        continue_selling: form.continue_selling,
        is_digital: form.is_digital,
        digital_file_url: form.is_digital ? form.digital_file_url : null,
        digital_download_limit: form.is_digital ? (parseInt(form.digital_download_limit) || 0) : null,
        min_quantity: parseInt(form.min_quantity) || 1,
        max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
        visibility: form.visibility,
        meta_title: form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        url_slug: form.url_slug.trim() || form.name.toLowerCase().replace(/\s+/g, "-"),
        weight: form.weight ? parseFloat(form.weight) : null,
        length: form.length ? parseFloat(form.length) : null,
        width: form.width ? parseFloat(form.width) : null,
        height: form.height ? parseFloat(form.height) : null,
        status: form.visibility === "active" ? "active" : "draft",
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          images: [],
          collection_ids: selectedCollections,
          variant_options: variantOptions.filter((o) => o.name && o.values.length > 0).map((o) => ({
            option_name: o.name,
            option_values: o.values,
          })),
          variants: variantCombinations.map((c) => ({
            variant_name: Object.entries(c.options).map(([k, v]) => `${k}: ${v}`).join(", "),
            price: parseFloat(c.price) || 0,
            compare_price: c.compare_price ? parseFloat(c.compare_price) : null,
            quantity: parseInt(c.quantity) || 0,
            sku: c.sku || null,
          })),
          specifications: specifications.filter((s) => s.key && s.value),
          custom_fields: customFields.filter((f) => f.label).map((f) => ({
            label: f.label,
            field_type: f.field_type,
            is_required: f.is_required,
            char_limit: f.char_limit ? parseInt(f.char_limit) : null,
            additional_price: f.additional_price ? parseFloat(f.additional_price) : 0,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      const productId = data.product.id;

      if (images.length > 0) {
        const uploadedUrls = await uploadImagesToR2(productId);
        const imageRecords = uploadedUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          sort_order: index,
        }));
        await supabase.from("product_images").insert(imageRecords);
      }

      await supabase.from("products").select("id").limit(1);
      router.push(`/dashboard/${storeSlug}/products`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#666666]" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Add product</h1>
          <p className="text-[#888888] text-sm">Create a new product for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <BasicInfoSection
          form={form}
          setForm={setForm}
          images={images}
          setImages={setImages}
          imagePreviews={imagePreviews}
          setImagePreviews={setImagePreviews}
          dragOver={dragOver}
          setDragOver={setDragOver}
          handleImageSelect={handleImageSelect}
          removeImage={removeImage}
        />

        <CollectionsSection
          collections={collections}
          selectedCollections={selectedCollections}
          setSelectedCollections={setSelectedCollections}
          newCollectionName={newCollectionName}
          setNewCollectionName={setNewCollectionName}
          showNewCollection={showNewCollection}
          setShowNewCollection={setShowNewCollection}
          handleCreateCollection={handleCreateCollection}
        />

        <PricingSection form={form} setForm={setForm} />
        <TaxSection form={form} setForm={setForm} />
        <FeesSection form={form} setForm={setForm} />
        <InventorySection form={form} setForm={setForm} />

        <VariantsSection
          variantOptions={variantOptions}
          setVariantOptions={setVariantOptions}
          variantCombinations={variantCombinations}
          setVariantCombinations={setVariantCombinations}
          form={form}
        />

        <ShippingSection form={form} setForm={setForm} />
        <SpecificationsSection specifications={specifications} setSpecifications={setSpecifications} />
        <CustomFieldsSection customFields={customFields} setCustomFields={setCustomFields} />
        <DigitalSection form={form} setForm={setForm} />
        <SeoSection form={form} setForm={setForm} />
        <VisibilitySection form={form} setForm={setForm} />
        <PurchaseLimitsSection form={form} setForm={setForm} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 sm:pt-4">
          <button
            type="submit"
            disabled={uploading || !storeSlug}
            className="flex-1 bg-[#1a1a1a] text-white font-semibold py-3 sm:py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating product...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create product</span>
                <span className="sm:hidden">Create</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}