"use client";

import { formatInr, orderTotals } from "@/lib/pricing";
import { useShop } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const shop = useShop();
  const router = useRouter();
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<"razorpay" | "cod">("razorpay");
  const subtotal = shop.cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const totals = orderTotals(subtotal, 0);

  async function submit(formData: FormData) {
    setError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: shop.cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        couponCode: shop.couponCode ?? undefined,
        provider,
        email: String(formData.get("email") || ""),
        address: {
          line1: String(formData.get("line1")),
          city: String(formData.get("city")),
          state: String(formData.get("state")),
          pincode: String(formData.get("pincode")),
          phone: String(formData.get("phone")),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Checkout failed");
    if (data.demo && provider === "razorpay") {
      const paid = await fetch("/api/webhooks/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_order_id: data.gatewayOrderId, razorpay_payment_id: `pay_${data.orderNumber}`, razorpay_signature: "demo" }),
      });
      if (!paid.ok) return setError("Payment could not be confirmed");
    }
    shop.clear();
    router.push(`/checkout/success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
      <form action={submit} className="space-y-3">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="text-sm">Guest checkout is available. <Link href="/login?callbackUrl=/checkout">Log in</Link> to use saved addresses.</p>
        <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border bg-transparent p-2" />
        <input name="line1" required placeholder="Address line" className="w-full rounded-xl border bg-transparent p-2" />
        <div className="grid grid-cols-2 gap-2">
          <input name="city" required placeholder="City" className="rounded-xl border bg-transparent p-2" />
          <input name="state" required placeholder="State" className="rounded-xl border bg-transparent p-2" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="pincode" required minLength={6} placeholder="Pincode" className="rounded-xl border bg-transparent p-2" onBlur={async (e) => {
            if (e.target.value.length !== 6) return;
            const res = await fetch(`https://api.postalpincode.in/pincode/${e.target.value}`);
            const data = await res.json();
            const office = data?.[0]?.PostOffice?.[0];
            if (!office) return;
            const form = e.target.form;
            if (!form) return;
            (form.elements.namedItem("city") as HTMLInputElement).value = office.District;
            (form.elements.namedItem("state") as HTMLInputElement).value = office.State;
          }} />
          <input name="phone" required placeholder="Phone" className="rounded-xl border bg-transparent p-2" />
        </div>
        <fieldset className="text-sm">
          <legend>Payment</legend>
          <label className="mr-4"><input type="radio" checked={provider === "razorpay"} onChange={() => setProvider("razorpay")} /> Razorpay</label>
          <label><input type="radio" checked={provider === "cod"} onChange={() => setProvider("cod")} /> Cash on delivery</label>
          {provider === "cod" && <p className="mt-1 text-[var(--muted)]">COD orders are confirmed immediately and collected on delivery.</p>}
        </fieldset>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded-full bg-[var(--fg)] px-5 py-2 text-[var(--bg)]" disabled={!shop.cart.length}>Place order</button>
      </form>
      <aside className="glass h-fit rounded-3xl p-4 text-sm">
        {shop.cart.map((line) => <p key={line.variantId}>{line.title} × {line.quantity}</p>)}
        <p className="mt-3 font-semibold">Total {formatInr(totals.total)}</p>
        <Link href="/cart">Edit cart</Link>
      </aside>
    </div>
  );
}
