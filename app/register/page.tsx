"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  return (
    <form
      className="mx-auto max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        if (data.password !== data.confirm) return setMessage("Passwords do not match");
        const res = await fetch("/api/register", { method: "POST", body: JSON.stringify(data) });
        const body = await res.json();
        setMessage(res.ok ? "Account created. You can log in. Email verification can be completed later." : body.error);
      }}
    >
      <h1 className="text-3xl font-semibold">Register</h1>
      <input name="name" required placeholder="Name" className="w-full rounded-xl border bg-transparent p-2" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border bg-transparent p-2" />
      <input name="phone" required placeholder="Phone" className="w-full rounded-xl border bg-transparent p-2" />
      <input name="password" type="password" minLength={8} required placeholder="Password" className="w-full rounded-xl border bg-transparent p-2" />
      <input name="confirm" type="password" required placeholder="Confirm password" className="w-full rounded-xl border bg-transparent p-2" />
      {message && <p className="text-sm">{message}</p>}
      <button className="rounded-full bg-[var(--fg)] px-5 py-2 text-[var(--bg)]">Create account</button>
    </form>
  );
}
