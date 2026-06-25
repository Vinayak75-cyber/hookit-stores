"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import {
  ShoppingBag,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Package,
  Truck,
  Shield,
  RotateCcw,
  Percent,
  Weight,
  Ruler,
  Tag,
  Hash,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  FileText,
  Box,
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  storeSlug: string;
  variantName?: string;
  sku?: string;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isDigital?: boolean;
  shippingFee?: number;
  additionalFee?: number;
  platformFee?: number;
  platformFeeType?: string;
  gstPercentage?: number;
  gstMode?: string;
  customFields?: { label: string; value: string; additionalPrice: number }[];
}

export default function CartPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const router = useRouter();
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);

  const { items, updateQuantity, removeItem, clearCart } = useCartStore();

  const storeItems = items.filter((item) => item.storeSlug === storeSlug);
  const itemCount = storeItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate per-item totals with all fees
  const getItemTotal = (item: any) => {
    let unitPrice = item.price;
    let shippingFee = item.shippingFee || 0;
    let additionalFee = item.additionalFee || 0;
    let platformFee = item.platformFee || 0;

    if (item.platformFeeType === "percentage" && platformFee > 0) {
      platformFee = (unitPrice * platformFee) / 100;
    }

    let gstAmount = 0;
    if (item.gstMode === "excluded" && (item.gstPercentage || 0) > 0) {
      gstAmount = (unitPrice * (item.gstPercentage || 0)) / 100;
    }

    let customFieldsTotal = 0;
    if (item.customFields) {
      customFieldsTotal = item.customFields.reduce((sum: number, cf: any) => sum + (cf.additionalPrice || 0), 0);
    }

    const unitTotal = unitPrice + shippingFee + additionalFee + platformFee + gstAmount + customFieldsTotal;
    return unitTotal * item.quantity;
  };

  const getItemUnitBreakdown = (item: any) => {
    let unitPrice = item.price;
    let shippingFee = item.shippingFee || 0;
    let additionalFee = item.additionalFee || 0;
    let platformFee = item.platformFee || 0;

    if (item.platformFeeType === "percentage" && platformFee > 0) {
      platformFee = (unitPrice * platformFee) / 100;
    }

    let gstAmount = 0;
    if (item.gstMode === "excluded" && (item.gstPercentage || 0) > 0) {
      gstAmount = (unitPrice * (item.gstPercentage || 0)) / 100;
    }

    let customFieldsTotal = 0;
    if (item.customFields) {
      customFieldsTotal = item.customFields.reduce((sum: number, cf: any) => sum + (cf.additionalPrice || 0), 0);
    }

    return { unitPrice, shippingFee, additionalFee, platformFee, gstAmount, customFieldsTotal };
  };

  const subtotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalShipping = storeItems.reduce((sum, item) => sum + (item.shippingFee || 0) * item.quantity, 0);
  const totalAdditional = storeItems.reduce((sum, item) => sum + (item.additionalFee || 0) * item.quantity, 0);
  const totalPlatform = storeItems.reduce((sum, item) => {
    let fee = item.platformFee || 0;
    if (item.platformFeeType === "percentage" && fee > 0) {
      fee = (item.price * fee) / 100;
    }
    return sum + fee * item.quantity;
  }, 0);
  const totalGST = storeItems.reduce((sum, item) => {
    if (item.gstMode === "excluded" && (item.gstPercentage || 0) > 0) {
      return sum + (item.price * (item.gstPercentage || 0) / 100) * item.quantity;
    }
    return sum;
  }, 0);
  const totalCustomFields = storeItems.reduce((sum, item) => {
    if (item.customFields) {
      return sum + item.customFields.reduce((s: number, cf: any) => s + (cf.additionalPrice || 0), 0) * item.quantity;
    }
    return sum;
  }, 0);
  const grandTotal = storeItems.reduce((sum, item) => sum + getItemTotal(item), 0);

  if (storeItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-[#cccccc]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Your cart is empty</h2>
          <p className="text-[#888888] text-sm mb-6">Looks like you haven&apos;t added anything yet.</p>
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5e5]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue shopping
          </Link>
          <h1 className="text-lg font-semibold text-[#1a1a1a]">Shopping Cart ({itemCount})</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Cart Items */}
        <div className="space-y-4">
          {storeItems.map((item) => {
            const isExpanded = expandedItem === item.id;
            const breakdown = getItemUnitBreakdown(item);
            const itemTotal = getItemTotal(item);
            const hasExtras = breakdown.shippingFee > 0 || breakdown.additionalFee > 0 || breakdown.platformFee > 0 || breakdown.gstAmount > 0 || breakdown.customFieldsTotal > 0 || item.variantName || item.sku || item.weight || item.isDigital;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden"
              >
                {/* Main Row */}
                <div className="p-4 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-[#f5f5f5] overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#cccccc]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1a1a1a] truncate">{item.name}</h3>
                    {item.variantName && (
                      <p className="text-xs text-[#999999] mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {item.variantName}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-[#999999] mt-0.5 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {item.sku}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                      ₹{item.price.toLocaleString()}
                      {item.quantity > 1 && (
                        <span className="text-xs text-[#999999] font-normal ml-1">
                          × {item.quantity}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center border border-[#e5e5e5] rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="p-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                      <Minus className="w-3 h-3 text-[#666666]" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                      <Plus className="w-3 h-3 text-[#666666]" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[80px]">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      ₹{itemTotal.toLocaleString()}
                    </p>
                    {hasExtras && (
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="text-xs text-[#999999] hover:text-[#1a1a1a] mt-1 flex items-center gap-0.5 ml-auto transition-colors"
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-3 h-3" />Hide details</>
                        ) : (
                          <><ChevronDown className="w-3 h-3" />Details</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasExtras && (
                  <div className="px-4 pb-4 border-t border-[#f0f0f0]">
                    {/* Price Breakdown */}
                    {(breakdown.shippingFee > 0 || breakdown.additionalFee > 0 || breakdown.platformFee > 0 || breakdown.gstAmount > 0 || breakdown.customFieldsTotal > 0) && (
                      <div className="mt-3 p-3 rounded-xl bg-[#f8f8f8] space-y-1.5">
                        <p className="text-xs font-medium text-[#1a1a1a] mb-2">Price breakdown (per unit)</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#666666]">Base price</span>
                          <span className="text-[#1a1a1a]">₹{breakdown.unitPrice.toLocaleString()}</span>
                        </div>
                        {breakdown.shippingFee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#666666] flex items-center gap-1"><Truck className="w-3 h-3" />Shipping</span>
                            <span className="text-[#1a1a1a]">₹{breakdown.shippingFee.toLocaleString()}</span>
                          </div>
                        )}
                        {breakdown.additionalFee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#666666]">Additional fee</span>
                            <span className="text-[#1a1a1a]">₹{breakdown.additionalFee.toLocaleString()}</span>
                          </div>
                        )}
                        {breakdown.platformFee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#666666]">Platform fee</span>
                            <span className="text-[#1a1a1a]">₹{breakdown.platformFee.toLocaleString()}</span>
                          </div>
                        )}
                        {breakdown.gstAmount > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#666666] flex items-center gap-1"><Percent className="w-3 h-3" />GST</span>
                            <span className="text-[#1a1a1a]">₹{breakdown.gstAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {breakdown.customFieldsTotal > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#666666] flex items-center gap-1"><FileText className="w-3 h-3" />Custom options</span>
                            <span className="text-[#1a1a1a]">₹{breakdown.customFieldsTotal.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-medium border-t border-[#e5e5e5] pt-1.5">
                          <span className="text-[#1a1a1a]">Unit total</span>
                          <span className="text-[#1a1a1a]">₹{(itemTotal / item.quantity).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[#1a1a1a]">Line total ({item.quantity}×)</span>
                          <span className="text-[#1a1a1a]">₹{itemTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Custom Fields Values */}
                    {item.customFields && item.customFields.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-[#1a1a1a] mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3" />Custom Options
                        </p>
                        <div className="space-y-1">
                          {item.customFields.map((cf: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-[#666666]">{cf.label}</span>
                              <span className="text-[#1a1a1a]">{cf.value}{cf.additionalPrice > 0 && ` (+₹${cf.additionalPrice})`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping / Digital Info */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.isDigital && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs">
                          <Globe className="w-3 h-3" />Digital product
                        </span>
                      )}
                      {item.weight !== null && item.weight !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f5f5f5] text-[#666666] text-xs">
                          <Weight className="w-3 h-3" />{item.weight} kg
                        </span>
                      )}
                      {(item.length || item.width || item.height) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f5f5f5] text-[#666666] text-xs">
                          <Ruler className="w-3 h-3" />{item.length || 0}×{item.width || 0}×{item.height || 0} cm
                        </span>
                      )}
                      {(item.gstPercentage || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f5f5f5] text-[#666666] text-xs">
                          <Percent className="w-3 h-3" />{(item.gstPercentage || 0)}% GST {item.gstMode === "included" ? "(incl.)" : "(excl.)"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="mt-8 bg-white border border-[#e5e5e5] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4 uppercase tracking-wider">Order Summary</h2>

          <div className="space-y-3 pb-4 border-b border-[#e5e5e5]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#666666]">Subtotal ({itemCount} items)</span>
              <span className="font-medium text-[#1a1a1a]">₹{subtotal.toLocaleString()}</span>
            </div>

            {totalShipping > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Shipping</span>
                <span className="font-medium text-[#1a1a1a]">₹{totalShipping.toLocaleString()}</span>
              </div>
            )}

            {totalAdditional > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666]">Additional fees</span>
                <span className="font-medium text-[#1a1a1a]">₹{totalAdditional.toLocaleString()}</span>
              </div>
            )}

            {totalPlatform > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666]">Platform fees</span>
                <span className="font-medium text-[#1a1a1a]">₹{totalPlatform.toLocaleString()}</span>
              </div>
            )}

            {totalGST > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><Percent className="w-3.5 h-3.5" />GST</span>
                <span className="font-medium text-[#1a1a1a]">₹{totalGST.toLocaleString()}</span>
              </div>
            )}

            {totalCustomFields > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Custom options</span>
                <span className="font-medium text-[#1a1a1a]">₹{totalCustomFields.toLocaleString()}</span>
              </div>
            )}

            {totalShipping === 0 && totalAdditional === 0 && totalPlatform === 0 && totalGST === 0 && totalCustomFields === 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666] flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-lg font-semibold text-[#1a1a1a]">Total</span>
            <span className="text-2xl font-bold text-[#1a1a1a]">₹{grandTotal.toLocaleString()}</span>
          </div>

          {/* Savings badge */}
          {storeItems.some((item) => item.comparePrice && item.comparePrice > item.price) && (
            <div className="mt-3 p-2.5 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs text-green-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                You&apos;re saving ₹{storeItems.reduce((sum, item) => sum + ((item.comparePrice || item.price) - item.price) * item.quantity, 0).toLocaleString()} on this order
              </p>
            </div>
          )}

          <button
            onClick={() => router.push(`/${storeSlug}/checkout`)}
            className="w-full mt-6 bg-[#1a1a1a] text-white font-semibold py-4 rounded-xl hover:bg-[#333333] transition-colors flex items-center justify-center gap-2"
          >
            Proceed to checkout
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => clearCart()}
            className="w-full mt-3 text-sm text-[#999999] hover:text-red-500 transition-colors py-2"
          >
            Clear cart
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { icon: Truck, label: "Free shipping" },
            { icon: Shield, label: "Secure payment" },
            { icon: RotateCcw, label: "Easy returns" },
          ].map((badge) => (
            <div key={badge.label} className="text-center p-4 rounded-xl bg-white border border-[#e5e5e5]">
              <badge.icon className="w-5 h-5 mx-auto mb-2 text-[#666666]" />
              <p className="text-xs text-[#666666]">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}