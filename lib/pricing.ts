export const FREE_SHIPPING_THRESHOLD = 99900;
export const SHIPPING_FEE = 7900;
export const TAX_RATE = 0.18;

export type CouponInput = {
  type: "flat" | "percent" | "bogo";
  value: number;
  minCartValue: number;
  isActive: boolean;
  expiresAt: Date | number | null;
  maxUses: number | null;
  usedCount: number;
};

export function percentOff(price: number, compareAt: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function couponDiscount(subtotal: number, coupon: CouponInput | null, itemCount = 1) {
  if (!coupon) return { ok: false as const, discount: 0, error: "Enter a code" };
  if (!coupon.isActive) return { ok: false as const, discount: 0, error: "This code is inactive" };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { ok: false as const, discount: 0, error: "This code has expired" };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false as const, discount: 0, error: "This code has reached its limit" };
  }
  if (subtotal < coupon.minCartValue) {
    return {
      ok: false as const,
      discount: 0,
      error: `Add ${formatInr(coupon.minCartValue - subtotal)} more to use this code`,
    };
  }
  if (coupon.type === "percent") {
    return { ok: true as const, discount: Math.round((subtotal * coupon.value) / 100), error: null };
  }
  if (coupon.type === "bogo") {
    const unit = itemCount > 0 ? Math.round(subtotal / itemCount) : 0;
    return { ok: true as const, discount: Math.min(subtotal, unit * coupon.value), error: null };
  }
  return { ok: true as const, discount: Math.min(subtotal, coupon.value), error: null };
}

export function orderTotals(subtotal: number, discount: number) {
  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + shipping + tax;
  const awayFromFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - taxable);
  return { shipping, tax, total, awayFromFreeShipping };
}

export function clampQty(qty: number, stock: number) {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(Math.max(1, Math.floor(qty)), Math.max(1, stock));
}
