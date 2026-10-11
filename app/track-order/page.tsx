"use client";

import { useState } from "react";

export default function TrackPage() {
  const [result, setResult] = useState<string>("");
  return (
    <form
      className="mx-auto max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const res = await fetch(`/api/orders/${data.get("orderNumber")}/track`, {
          method: "POST",
          body: JSON.stringify({ phone: data.get("phone"), email: data.get("email") }),
        });
        const body = await res.json();
        setResult(res.ok ? `${body.status}: ${body.events.map((event: { note: string }) => event.note).join(" → ")}` : body.error);
      }}
    >
      <h1 className="text-3xl font-semibold">Track your order</h1>
      <input name="orderNumber" required placeholder="Order number" className="w-full rounded border bg-transparent p-2" />
      <input name="phone" placeholder="Phone" className="w-full rounded border bg-transparent p-2" />
      <input name="email" placeholder="Email" className="w-full rounded border bg-transparent p-2" />
      <button className="rounded-full bg-[var(--fg)] px-4 py-2 text-[var(--bg)]">Track</button>
      {result && <p className="text-sm">{result}</p>}
    </form>
  );
}
