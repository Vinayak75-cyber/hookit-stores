"use client";

import React, { useState, useCallback, useEffect } from "react";
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

interface ExistingImage {
  id: string;
  url: string;
  position: number;
}

interface ProductForm {
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
}

// ==================== SECTION COMPONENTS ====================

function BasicInfoSection({ form, setForm, images, setImages, imagePreviews, setImagePreviews, dragOver, setDragOver, handleImageSelect, removeImage, existingImages, removeExistingImage }: any) {
  const totalImages = existingImages.length + images.length;
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group" open>
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Package className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Basic Information</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-4">
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
            className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your product..."
            rows={4}
            className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((prev: any) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Clothing"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((prev: any) => ({ ...prev, brand: e.target.value }))}
              placeholder="e.g., Nike"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm((prev: any) => ({ ...prev, sku: e.target.value }))}
              placeholder="e.g., SHIRT-001"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Video URL</label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm((prev: any) => ({ ...prev, video_url: e.target.value }))}
              placeholder="YouTube or Vimeo link"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Product Images</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageSelect(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragOver ? "border-[#1a1a1a] bg-[#fafafa]" : "border-[#e5e5e5]"}`}
          >
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-[#999999]" />
            <p className="text-sm text-[#666666]">Drag and drop images or click to browse</p>
            <label className="inline-flex items-center gap-2 mt-3 bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-[#333333]">
              <Upload className="w-4 h-4" />
              Upload
              <input type="file" multiple accept="image/*" onChange={(e) => handleImageSelect(e.target.files)} className="hidden" />
            </label>
          </div>
          {totalImages > 0 && (
            <div className="grid grid-cols-5 gap-3 mt-3">
              {existingImages.map((img: any, index: number) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#f5f5f5] group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-[#1a1a1a] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">Main</span>
                  )}
                </div>
              ))}
              {imagePreviews.map((preview: string, index: number) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-[#f5f5f5] group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100">
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Layers className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Collections</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-3">
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
            <button type="button" onClick={handleCreateCollection} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-sm">
              Create
            </button>
            <button type="button" onClick={() => setShowNewCollection(false)} className="text-[#999999]">
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Pricing</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Percent className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Tax Settings</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-4">
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
            className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm bg-white"
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Fees & Charges</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Shipping fee</label>
            <input
              type="number"
              step="0.01"
              value={form.shipping_fee}
              onChange={(e) => setForm((prev: any) => ({ ...prev, shipping_fee: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
                className="flex-1 border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
              />
              <select
                value={form.platform_fee_type}
                onChange={(e) => setForm((prev: any) => ({ ...prev, platform_fee_type: e.target.value }))}
                className="border border-[#e5e5e5] rounded-xl py-3 px-2 text-sm bg-white"
              >
                <option value="fixed">&#8377;</option>
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Boxes className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Inventory</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f8f8]">
          <span className="text-sm font-medium text-[#1a1a1a]">Track inventory</span>
          <button
            type="button"
            onClick={() => setForm((prev: any) => ({ ...prev, track_inventory: !prev.track_inventory }))}
          >
            {form.track_inventory ? (
              <ToggleRight className="w-8 h-8 text-[#1a1a1a]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[#999999]" />
            )}
          </button>
        </div>
        {form.track_inventory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Quantity</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((prev: any) => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Low stock alert</label>
              <input
                type="number"
                value={form.low_stock_alert}
                onChange={(e) => setForm((prev: any) => ({ ...prev, low_stock_alert: e.target.value }))}
                placeholder="5"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Product Variants</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-4">
        {variantOptions.map((option: any) => (
          <div key={option.id} className="p-4 rounded-xl bg-[#f8f8f8] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={option.name}
                onChange={(e) => updateVariantOption(option.id, e.target.value, option.values.join(", "))}
                placeholder="Option name (e.g., Size)"
                className="flex-1 border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm bg-white"
              />
              <button type="button" onClick={() => removeVariantOption(option.id)} className="text-red-500">
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
        <div className="flex gap-2">
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
              <div key={combo.id} className="grid grid-cols-5 gap-2 p-3 rounded-xl bg-white border border-[#e5e5e5]">
                <div className="col-span-2 text-sm text-[#666666]">
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Truck className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Shipping</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={form.weight}
              onChange={(e) => setForm((prev: any) => ({ ...prev, weight: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <List className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Specifications</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-2">
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
            <button type="button" onClick={() => removeSpecification(spec.id)} className="text-red-500">
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Custom Options</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-3">
        {customFields.map((field: any) => (
          <div key={field.id} className="p-4 rounded-xl bg-[#f8f8f8] space-y-2">
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
                className="border border-[#e5e5e5] rounded-xl py-2 px-3 text-sm bg-white"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="file">File</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <button type="button" onClick={() => removeCustomField(field.id)} className="text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
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
                className="w-24 border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm bg-white"
              />
              <input
                type="number"
                step="0.01"
                value={field.additional_price}
                onChange={(e) => updateCustomField(field.id, "additional_price", e.target.value)}
                placeholder="Extra price"
                className="w-28 border border-[#e5e5e5] rounded-lg py-1.5 px-2 text-sm bg-white"
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
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Digital Product</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f8f8]">
          <span className="text-sm font-medium text-[#1a1a1a]">This is a digital product</span>
          <button
            type="button"
            onClick={() => setForm((prev: any) => ({ ...prev, is_digital: !prev.is_digital }))}
          >
            {form.is_digital ? (
              <ToggleRight className="w-8 h-8 text-[#1a1a1a]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[#999999]" />
            )}
          </button>
        </div>
        {form.is_digital && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Download URL</label>
              <input
                type="url"
                value={form.digital_file_url}
                onChange={(e) => setForm((prev: any) => ({ ...prev, digital_file_url: e.target.value }))}
                placeholder="File download link"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Download limit</label>
              <input
                type="number"
                value={form.digital_download_limit}
                onChange={(e) => setForm((prev: any) => ({ ...prev, digital_download_limit: e.target.value }))}
                placeholder="0 = unlimited"
                className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function SeoSection({ form, setForm }: any) {
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">SEO Settings</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Meta title</label>
          <input
            type="text"
            value={form.meta_title}
            onChange={(e) => setForm((prev: any) => ({ ...prev, meta_title: e.target.value }))}
            placeholder="SEO title"
            className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Meta description</label>
          <textarea
            value={form.meta_description}
            onChange={(e) => setForm((prev: any) => ({ ...prev, meta_description: e.target.value }))}
            placeholder="SEO description"
            rows={2}
            className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">URL slug</label>
          <input
            type="text"
            value={form.url_slug}
            onChange={(e) => setForm((prev: any) => ({ ...prev, url_slug: e.target.value }))}
            placeholder="product-url-slug"
            className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
          />
        </div>
      </div>
    </details>
  );
}

function VisibilitySection({ form, setForm }: any) {
  const options = ["active", "draft", "hidden"] as const;
  return (
    <details className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group" open>
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Eye className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Visibility</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5">
        <div className="flex gap-3">
          {options.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm((prev: any) => ({ ...prev, visibility: v }))}
              className={`flex-1 py-2.5 rounded-xl text-sm border transition-all capitalize ${
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
      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#fafafa] transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Hash className="w-4 h-4 text-[#666666]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Purchase Limits</h3>
        </div>
        <ChevronDown className="w-4 h-4 text-[#999999] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 border-t border-[#f0f0f0] pt-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Minimum quantity</label>
            <input
              type="number"
              value={form.min_quantity}
              onChange={(e) => setForm((prev: any) => ({ ...prev, min_quantity: e.target.value }))}
              placeholder="1"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Maximum quantity</label>
            <input
              type="number"
              value={form.max_quantity}
              onChange={(e) => setForm((prev: any) => ({ ...prev, max_quantity: e.target.value }))}
              placeholder="No limit"
              className="w-full border border-[#e5e5e5] rounded-xl py-3 px-4 text-sm"
            />
          </div>
        </div>
      </div>
    </details>
  );
}
// ==================== MAIN PAGE COMPONENT ====================

export default function EditProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState<ProductForm>({
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
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setStoreSlug(p.storeSlug);
      setProductId(p.productId);
    }).catch((err) => {
      console.error("Params error:", err);
      setError("Failed to load page parameters");
      setIsLoading(false);
    });
  }, [params]);

  // Timeout fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setError("Loading timed out. Please refresh the page.");
        setIsLoading(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Load product data
  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        // Fetch product
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (productError || !product) {
          setError("Product not found");
          setIsLoading(false);
          return;
        }

        setForm({
          name: product.name || "",
          description: product.description || "",
          category: product.category || "",
          brand: product.brand || "",
          video_url: product.video_url || "",
          sku: product.sku || "",
          price: product.price?.toString() || "",
          compare_at_price: product.compare_at_price?.toString() || "",
          cost_price: product.cost_price?.toString() || "",
          gst_mode: product.gst_mode || "included",
          gst_percentage: product.gst_percentage?.toString() || "0",
          shipping_fee: product.shipping_fee?.toString() || "",
          additional_fee: product.additional_fee?.toString() || "",
          platform_fee: product.platform_fee?.toString() || "",
          platform_fee_type: product.platform_fee_type || "fixed",
          track_inventory: product.track_inventory ?? true,
          stock: product.stock?.toString() || "",
          low_stock_alert: product.low_stock_alert?.toString() || "5",
          continue_selling: product.continue_selling ?? false,
          is_digital: product.is_digital ?? false,
          digital_file_url: product.digital_file_url || "",
          digital_download_limit: product.digital_download_limit?.toString() || "",
          min_quantity: product.min_quantity?.toString() || "1",
          max_quantity: product.max_quantity?.toString() || "",
          visibility: product.visibility || "draft",
          meta_title: product.meta_title || "",
          meta_description: product.meta_description || "",
          url_slug: product.url_slug || "",
          weight: product.weight?.toString() || "",
          length: product.length?.toString() || "",
          width: product.width?.toString() || "",
          height: product.height?.toString() || "",
        });

        // Fetch images
        const { data: imagesData, error: imagesError } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("sort_order", { ascending: true });

        if (imagesError) {
          console.error("Images fetch error:", imagesError);
        }

        if (imagesData && imagesData.length > 0) {
          setExistingImages(
            imagesData.map((img: any) => ({
              id: img.id,
              url: img.image_url,
              position: img.sort_order || 0,
            }))
          );
        }

        // Fetch product collections
        if (product.store_id) {
          const { data: pcData } = await supabase
  .from("collection_products")
  .select("collection_id")
  .eq("product_id", productId);
          if (pcData) {
            setSelectedCollections(pcData.map((pc: any) => pc.collection_id));
          }

          // Fetch all collections for this store
          const { data: colData } = await supabase
            .from("collections")
            .select("*")
            .eq("store_id", product.store_id);
          if (colData) {
            setCollections(colData);
          }
        }

        // Fetch variant options
        const { data: voData } = await supabase
          .from("product_variant_options")
          .select("*")
          .eq("product_id", productId);
        if (voData && voData.length > 0) {
          setVariantOptions(
            voData.map((vo: any) => ({
              id: vo.id || crypto.randomUUID(),
              name: vo.option_name || "",
              values: vo.option_values || [],
            }))
          );
        }

        // Fetch variants
        const { data: vData } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId);
        if (vData && vData.length > 0) {
          setVariantCombinations(
            vData.map((v: any) => ({
              id: v.id || crypto.randomUUID(),
              options: v.variant_options || {},
              price: v.price?.toString() || "",
              compare_price: v.compare_price?.toString() || "",
              quantity: v.quantity?.toString() || "",
              sku: v.sku || "",
            }))
          );
        }

        // Fetch specifications
        const { data: specData } = await supabase
          .from("product_specifications")
          .select("*")
          .eq("product_id", productId);
        if (specData && specData.length > 0) {
          setSpecifications(
            specData.map((s: any) => ({
              id: s.id || crypto.randomUUID(),
              key: s.spec_key || "",
              value: s.spec_value || "",
            }))
          );
        }

        // Fetch custom fields
        const { data: cfData } = await supabase
          .from("product_custom_fields")
          .select("*")
          .eq("product_id", productId);
        if (cfData && cfData.length > 0) {
          setCustomFields(
            cfData.map((f: any) => ({
              id: f.id || crypto.randomUUID(),
              label: f.label || "",
              field_type: f.field_type || "text",
              is_required: f.is_required ?? false,
              char_limit: f.char_limit?.toString() || "",
              additional_price: f.additional_price?.toString() || "",
            }))
          );
        }
      } catch (err: any) {
        console.error("Load product error:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId, supabase]);

  const handleImageSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (newFiles.length + images.length + existingImages.length > 10) {
        setError("Maximum 10 images allowed");
        return;
      }
      setImages((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setError("");
    },
    [images.length, existingImages.length]
  );

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const uploadImagesToR2 = async (pid: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${storeSlug}/${pid}/${Date.now()}-${i}.${file.name.split(".").pop()}`;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fileName", fileName);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
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
    if (!storeSlug || !productId) return;

    setUploading(true);
    setError("");

    if (!form.name.trim() || !form.price) {
      setError("Product name and price are required");
      setUploading(false);
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      setUploading(false);
      return;
    }

    try {
      // Delete removed images
      if (imagesToDelete.length > 0) {
        await supabase.from("product_images").delete().in("id", imagesToDelete);
      }

      // Update product
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category.trim() || null,
          brand: form.brand.trim() || null,
          video_url: form.video_url.trim() || null,
          sku: form.sku.trim() || null,
          price: price,
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (updateError) throw updateError;

      // Update collections
      await supabase.from("collection_products").delete().eq("product_id", productId); 
      if (selectedCollections.length > 0) {
  const pcRecords = selectedCollections.map((cid) => ({
    product_id: productId,
    collection_id: cid,
  }));
  await supabase.from("collection_products").insert(pcRecords);  // ✅ FIXED
}

      // Update variant options
      await supabase.from("product_variant_options").delete().eq("product_id", productId);
      const validOptions = variantOptions.filter((o: any) => o.name && o.values.length > 0);
      if (validOptions.length > 0) {
        const voRecords = validOptions.map((o: any) => ({
          product_id: productId,
          option_name: o.name,
          option_values: o.values,
        }));
        await supabase.from("product_variant_options").insert(voRecords);
      }

      // Update variants
      await supabase.from("product_variants").delete().eq("product_id", productId);
      if (variantCombinations.length > 0) {
        const vRecords = variantCombinations.map((c: any) => ({
          product_id: productId,
          variant_name: Object.entries(c.options).map(([k, v]) => `${k}: ${v}`).join(", "),
          variant_options: c.options,
          price: parseFloat(c.price) || 0,
          compare_price: c.compare_price ? parseFloat(c.compare_price) : null,
          quantity: parseInt(c.quantity) || 0,
          sku: c.sku || null,
        }));
        await supabase.from("product_variants").insert(vRecords);
      }

      // Update specifications
      await supabase.from("product_specifications").delete().eq("product_id", productId);
      const validSpecs = specifications.filter((s: any) => s.key && s.value);
      if (validSpecs.length > 0) {
        const specRecords = validSpecs.map((s: any) => ({
          product_id: productId,
          spec_key: s.key,
          spec_value: s.value,
        }));
        await supabase.from("product_specifications").insert(specRecords);
      }

      // Update custom fields
      await supabase.from("product_custom_fields").delete().eq("product_id", productId);
      const validFields = customFields.filter((f: any) => f.label);
      if (validFields.length > 0) {
        const cfRecords = validFields.map((f: any) => ({
          product_id: productId,
          label: f.label,
          field_type: f.field_type,
          is_required: f.is_required,
          char_limit: f.char_limit ? parseInt(f.char_limit) : null,
          additional_price: f.additional_price ? parseFloat(f.additional_price) : 0,
        }));
        await supabase.from("product_custom_fields").insert(cfRecords);
      }

      // Upload new images
      if (images.length > 0) {
        const uploadedUrls = await uploadImagesToR2(productId);
        const imageRecords = uploadedUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          sort_order: existingImages.length + index,
          created_at: new Date().toISOString(),
        }));
        await supabase.from("product_images").insert(imageRecords);
      }

      router.push(`/dashboard/${storeSlug}/products`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#999999]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-[#e5e5e5] hover:border-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#666666]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Edit product</h1>
          <p className="text-[#888888] text-sm">Update your product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          existingImages={existingImages}
          removeExistingImage={removeExistingImage}
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={uploading || !storeSlug}
            className="flex-1 bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving changes...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}