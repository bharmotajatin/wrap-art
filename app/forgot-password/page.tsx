"use client";

import { useState } from "react";

export default function ForgotPage() {
  const [message, setMessage] = useState("");
  return (
    <form
      className="mx-auto max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/forgot-password", { method: "POST", body: JSON.stringify({ email: new FormData(e.currentTarget).get("email") }) });
        const data = await res.json();
        setMessage(data.devToken ? `Reset token (dev only): ${data.devToken}` : "If the account exists, a reset link was queued.");
      }}
    >
      <h1 className="text-3xl font-semibold">Reset password</h1>
      <input name="email" type="email" required className="w-full rounded-xl border bg-transparent p-2" />
      <button className="rounded-full bg-[var(--fg)] px-5 py-2 text-[var(--bg)]">Send reset</button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
