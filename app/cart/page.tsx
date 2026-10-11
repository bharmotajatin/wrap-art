"use client";

import { formatInr, orderTotals } from "@/lib/pricing";
import { useShop } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const shop = useShop();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState(0);
  const subtotal = shop.cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const blocked = shop.cart.some((line) => line.quantity > line.stock);
  const totals = orderTotals(subtotal, discount);

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div>
        <h1 className="text-3xl font-semibold">Cart</h1>
        {shop.cart.length === 0 && <p className="mt-4">Empty. <Link href="/collections/mobile-skins">Continue shopping</Link></p>}
        {shop.cart.map((line) => (
          <div key={line.variantId} className="mt-4 flex items-center justify-between gap-3 border-b py-3 text-sm">
            <div>
              <p className="font-medium">{line.title}</p>
              <p>{line.deviceModel} · {line.color}</p>
              {line.quantity > line.stock && <p className="text-red-600">Adjust quantity. Only {line.stock} left.</p>}
            </div>
            <input aria-label={`Quantity for ${line.title}`} className="w-16 rounded border bg-transparent p-1" type="number" min={1} max={line.stock} value={line.quantity} onChange={(e) => shop.setQty(line.variantId, Number(e.target.value))} />
            <p>{formatInr(line.unitPrice * line.quantity)}</p>
            <button onClick={() => shop.remove(line.variantId)}>Remove</button>
          </div>
        ))}
      </div>
      <aside className="glass h-fit rounded-3xl p-4 text-sm">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/coupons/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, subtotal, itemCount: shop.cart.reduce((n, l) => n + l.quantity, 0) }),
            });
            const data = await res.json();
            setMessage(data.error ?? `Saved ${formatInr(data.discount)}`);
            setDiscount(data.discount ?? 0);
            if (data.ok) shop.setCoupon(code.toUpperCase());
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon" className="w-full rounded border bg-transparent p-2" />
          <button className="mt-2 underline">Apply</button>
          {message && <p className="mt-1">{message}</p>}
        </form>
        <p className="mt-3">Subtotal {formatInr(subtotal)}</p>
        <p>Discount {formatInr(discount)}</p>
        <p>Shipping {formatInr(totals.shipping)}</p>
        {totals.awayFromFreeShipping > 0 && <p>Add {formatInr(totals.awayFromFreeShipping)} more for free shipping</p>}
        <p>Tax {formatInr(totals.tax)}</p>
        <p className="font-semibold">Total {formatInr(totals.total)}</p>
        <Link aria-disabled={blocked || shop.cart.length === 0} className={`mt-4 block rounded-full bg-[var(--fg)] py-2 text-center text-[var(--bg)] ${blocked ? "pointer-events-none opacity-40" : ""}`} href="/checkout">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
