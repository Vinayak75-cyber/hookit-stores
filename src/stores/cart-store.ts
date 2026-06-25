import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  storeSlug: string;
  // Extended fields
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
  comparePrice?: number | null;
}

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
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
  comparePrice?: number | null;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct, storeSlug: string, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  clearStoreCart: (storeSlug: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  getStoreTotal: (storeSlug: string) => number;
  getStoreItemCount: (storeSlug: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, storeSlug, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.id === product.id && item.storeSlug === storeSlug
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id && item.storeSlug === storeSlug
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...product,
                storeSlug,
                quantity,
                variantName: product.variantName,
                sku: product.sku,
                weight: product.weight,
                length: product.length,
                width: product.width,
                height: product.height,
                isDigital: product.isDigital,
                shippingFee: product.shippingFee,
                additionalFee: product.additionalFee,
                platformFee: product.platformFee,
                platformFeeType: product.platformFeeType,
                gstPercentage: product.gstPercentage,
                gstMode: product.gstMode,
                customFields: product.customFields,
                comparePrice: product.comparePrice,
              },
            ],
          };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== id)
              : state.items.map((item) =>
                  item.id === id ? { ...item, quantity } : item
                ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearCart: () => set({ items: [] }),

      clearStoreCart: (storeSlug) => {
        set((state) => ({
          items: state.items.filter((item) => item.storeSlug !== storeSlug),
        }));
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => {
          let unitTotal = item.price;
          unitTotal += item.shippingFee || 0;
          unitTotal += item.additionalFee || 0;
          let platformFee = item.platformFee || 0;
          if (item.platformFeeType === "percentage" && platformFee > 0) {
            platformFee = (item.price * platformFee) / 100;
          }
          unitTotal += platformFee;
          if (item.gstMode === "excluded" && (item.gstPercentage || 0) > 0) {
            unitTotal += (item.price * (item.gstPercentage || 0)) / 100;
          }
          if (item.customFields) {
            unitTotal += item.customFields.reduce((s, cf) => s + (cf.additionalPrice || 0), 0);
          }
          return sum + unitTotal * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getStoreTotal: (storeSlug) => {
        return get()
          .items.filter((item) => item.storeSlug === storeSlug)
          .reduce((sum, item) => {
            let unitTotal = item.price;
            unitTotal += item.shippingFee || 0;
            unitTotal += item.additionalFee || 0;
            let platformFee = item.platformFee || 0;
            if (item.platformFeeType === "percentage" && platformFee > 0) {
              platformFee = (item.price * platformFee) / 100;
            }
            unitTotal += platformFee;
            if (item.gstMode === "excluded" && (item.gstPercentage || 0) > 0) {
              unitTotal += (item.price * (item.gstPercentage || 0)) / 100;
            }
            if (item.customFields) {
              unitTotal += item.customFields.reduce((s, cf) => s + (cf.additionalPrice || 0), 0);
            }
            return sum + unitTotal * item.quantity;
          }, 0);
      },

      getStoreItemCount: (storeSlug) => {
        return get()
          .items.filter((item) => item.storeSlug === storeSlug)
          .reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "hookit-cart",
    }
  )
);