"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, type CartProduct } from "@/stores/cart-store";
import { Minus, Plus, ShoppingBag, Check, Zap } from "lucide-react";

export function AddToCartButton({
  product,
  storeSlug,
  theme,
}: {
  product: CartProduct;
  storeSlug: string;
  theme: {
    primary_color: string;
    accent_color: string;
    border_radius: string;
  };
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  // Calculate displayed price with fees for the button label
  const getDisplayPrice = () => {
    let unitPrice = product.price;
    unitPrice += product.shippingFee || 0;
    unitPrice += product.additionalFee || 0;
    let platformFee = product.platformFee || 0;
    if (product.platformFeeType === "percentage" && platformFee > 0) {
      platformFee = (product.price * platformFee) / 100;
    }
    unitPrice += platformFee;
    if (product.gstMode === "excluded" && (product.gstPercentage || 0) > 0) {
      unitPrice += (product.price * (product.gstPercentage || 0)) / 100;
    }
    if (product.customFields) {
      unitPrice += product.customFields.reduce((s, cf) => s + (cf.additionalPrice || 0), 0);
    }
    return unitPrice;
  };

  const handleAdd = () => {
    addItem(product, storeSlug, quantity);

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, storeSlug, quantity);
    router.push(`/${storeSlug}/cart`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-[#666666]">Quantity</span>
        <div className="flex items-center border border-[#e5e5e5] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2.5 hover:bg-[#f5f5f5] transition-colors"
          >
            <Minus className="w-4 h-4 text-[#666666]" />
          </button>
          <span className="w-12 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="p-2.5 hover:bg-[#f5f5f5] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#666666]" />
          </button>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex items-center gap-3">
        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          disabled={added}
          className="flex-1 py-4 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{
            backgroundColor: added ? "#22c55e" : theme.primary_color,
            borderRadius: theme.border_radius,
          }}
        >
          {added ? (
            <>
              <Check className="w-5 h-5" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              Add to cart
            </>
          )}
        </button>

        {/* Buy Now */}
        <button
          onClick={handleBuyNow}
          className="flex-1 py-4 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{
            backgroundColor: theme.accent_color || "#c9a96e",
            borderRadius: theme.border_radius,
          }}
        >
          <Zap className="w-5 h-5" />
          Buy now
        </button>
      </div>

      {/* Price hint */}
      <p className="text-xs text-[#999999] text-center">
        ₹{(getDisplayPrice() * quantity).toLocaleString()} total
      </p>
    </div>
  );
}