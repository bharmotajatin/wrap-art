"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productSlug: string;
  title: string;
  deviceModel: string;
  color: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  image: string;
};

type Store = {
  cart: CartLine[];
  wishlist: string[];
  couponCode: string | null;
  drawerOpen: boolean;
  add: (line: CartLine) => void;
  setQty: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  restore: (line: CartLine) => void;
  toggleWish: (productId: string) => void;
  setWish: (ids: string[]) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
  setDrawer: (open: boolean) => void;
};

export const useShop = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      couponCode: null,
      drawerOpen: false,
      add: (line) => {
        const existing = get().cart.find((item) => item.variantId === line.variantId);
        const cart = existing
          ? get().cart.map((item) =>
              item.variantId === line.variantId
                ? { ...item, quantity: Math.min(item.stock, item.quantity + line.quantity) }
                : item,
            )
          : [...get().cart, line];
        set({ cart, drawerOpen: true });
      },
      setQty: (variantId, quantity) =>
        set({
          cart: get().cart.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.min(item.stock, Math.max(1, quantity)) }
              : item,
          ),
        }),
      remove: (variantId) => set({ cart: get().cart.filter((item) => item.variantId !== variantId) }),
      restore: (line) => set({ cart: [...get().cart, line] }),
      toggleWish: (productId) => {
        const has = get().wishlist.includes(productId);
        set({
          wishlist: has ? get().wishlist.filter((id) => id !== productId) : [...get().wishlist, productId],
        });
      },
      setWish: (ids) => set({ wishlist: ids }),
      setCoupon: (couponCode) => set({ couponCode }),
      clear: () => set({ cart: [], couponCode: null }),
      setDrawer: (drawerOpen) => set({ drawerOpen }),
    }),
    { name: "wrap-art-shop" },
  ),
);
