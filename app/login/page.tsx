"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Form() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  return (
    <form
      className="mx-auto max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const res = await signIn("credentials", {
          email: data.get("email"),
          password: data.get("password"),
          redirect: false,
          callbackUrl: params.get("callbackUrl") ?? "/account",
        });
        if (res?.error) setError("Email or password is incorrect");
        else window.location.href = res?.url ?? "/account";
      }}
    >
      <h1 className="text-3xl font-semibold">Login</h1>
      <input name="email" type="email" required className="w-full rounded-xl border bg-transparent p-2" placeholder="Email" />
      <input name="password" type="password" required className="w-full rounded-xl border bg-transparent p-2" placeholder="Password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded-full bg-[var(--fg)] px-5 py-2 text-[var(--bg)]">Continue</button>
      <p className="text-sm"><Link href="/forgot-password">Forgot password</Link> · <Link href="/register">Register</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return <Suspense><Form /></Suspense>;
}
