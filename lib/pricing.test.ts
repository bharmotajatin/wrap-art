import { describe, expect, it } from "vitest";
import { clampQty, couponDiscount, orderTotals, percentOff } from "./pricing";

describe("pricing", () => {
  it("computes percent off", () => {
    expect(percentOff(79900, 129900)).toBe(38);
  });

  it("rejects coupons below minimum", () => {
    const result = couponDiscount(10000, {
      type: "percent",
      value: 10,
      minCartValue: 50000,
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
    });
    expect(result.ok).toBe(false);
  });

  it("applies percent coupons and free shipping", () => {
    const coupon = couponDiscount(200000, {
      type: "percent",
      value: 10,
      minCartValue: 0,
      isActive: true,
      expiresAt: null,
      maxUses: 10,
      usedCount: 1,
    });
    expect(coupon.discount).toBe(20000);
    const totals = orderTotals(200000, coupon.discount);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(180000 + Math.round(180000 * 0.18));
  });

  it("charges shipping under the threshold", () => {
    expect(orderTotals(50000, 0).shipping).toBe(7900);
  });

  it("clamps quantity to stock", () => {
    expect(clampQty(9, 3)).toBe(3);
    expect(clampQty(0, 5)).toBe(1);
  });
});
