"use client";

import { useShop } from "@/lib/store";
import Link from "next/link";

export default function WishlistPage() {
  const ids = useShop((s) => s.wishlist);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Wishlist</h1>
      {ids.length === 0 ? <p className="mt-4">Nothing saved yet.</p> : (
        <ul className="mt-4 space-y-2 text-sm">{ids.map((id) => <li key={id}>{id}</li>)}</ul>
      )}
      <Link href="/collections/mobile-skins" className="mt-4 inline-block underline">Browse skins</Link>
    </div>
  );
}
