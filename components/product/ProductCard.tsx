"use client";

import { formatInr, percentOff } from "@/lib/pricing";
import { useShop } from "@/lib/store";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "../ui/Toast";

type Variant = { id: string; deviceModel: string; color: string; stock: number; priceOverride: number | null };
type Product = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: { url: string; altText: string | null }[];
  variants: Variant[];
};

export function ProductCard({ product }: { product: Product }) {
  const shop = useShop();
  const toast = useToast();
  const [quick, setQuick] = useState(false);
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const wished = shop.wishlist.includes(product.id);
  const off = percentOff(product.basePrice, product.compareAtPrice);
  const models = Array.from(new Set(product.variants.map((v) => v.deviceModel)));
  const colors = Array.from(new Set(product.variants.filter((v) => !model || v.deviceModel === model).map((v) => v.color)));

  async function toggleWish() {
    const prev = wished;
    shop.toggleWish(product.id);
    const res = await fetch("/api/wishlist", {
      method: prev ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (!res.ok && res.status !== 401) {
      shop.toggleWish(product.id);
      toast("Could not update wishlist");
    }
  }

  function add() {
    const variant = product.variants.find((v) => v.deviceModel === model && v.color === color && v.stock > 0);
    if (!variant) return toast("Choose an in-stock model and color");
    shop.add({
      variantId: variant.id,
      productSlug: product.slug,
      title: product.title,
      deviceModel: variant.deviceModel,
      color: variant.color,
      unitPrice: variant.priceOverride ?? product.basePrice,
      quantity: 1,
      stock: variant.stock,
      image: product.images[0]?.url ?? "",
    });
    setQuick(false);
    toast("Added to cart");
  }

  return (
    <article className="glass glass-lite rounded-3xl p-3">
      <Link href={`/products/${product.slug}`} className="group relative block aspect-square overflow-hidden rounded-2xl">
        {product.images[0] && (
          <Image src={product.images[0].url} alt={product.images[0].altText ?? product.title} fill className="object-cover transition group-hover:opacity-0" sizes="300px" />
        )}
        {product.images[1] && (
          <Image src={product.images[1].url} alt="" fill className="object-cover opacity-0 transition group-hover:opacity-100" sizes="300px" />
        )}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <Link href={`/products/${product.slug}`} className="font-medium">{product.title}</Link>
          <p className="text-sm">
            {formatInr(product.basePrice)}{" "}
            {product.compareAtPrice && <span className="text-[var(--muted)] line-through">{formatInr(product.compareAtPrice)}</span>}
            {off > 0 && <span className="ml-2 rounded-full bg-[var(--accent)] px-2 text-xs text-white">{off}% off</span>}
          </p>
          <div className="mt-2 flex gap-1">
            {colors.slice(0, 4).map((swatch) => (
              <span key={swatch} className="h-3 w-3 rounded-full border" title={swatch} style={{ background: swatch === "Obsidian" ? "#222" : swatch === "Frost" ? "#d9e2ea" : swatch === "Crimson" ? "#a32020" : "#8ea58a" }} />
            ))}
          </div>
        </div>
        <button aria-label="Add to wishlist" onClick={toggleWish}><Heart fill={wished ? "currentColor" : "none"} size={18} /></button>
      </div>
      <button className="mt-3 w-full rounded-full border py-2 text-sm" onClick={() => setQuick(true)}>Quick add</button>
      {quick && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-label="Quick add">
          <div className="glass w-full max-w-md rounded-3xl p-4">
            <p className="font-medium">{product.title}</p>
            <label className="mt-3 block text-sm">Device model
              <select className="mt-1 w-full rounded-xl border bg-transparent p-2" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="">Select</option>
                {models.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <div className="mt-3 flex gap-2">
              {colors.map((name) => (
                <button key={name} className={`rounded-full border px-3 py-1 text-sm ${color === name ? "bg-[var(--fg)] text-[var(--bg)]" : ""}`} onClick={() => setColor(name)}>{name}</button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-[var(--fg)] px-4 py-2 text-sm text-[var(--bg)]" onClick={add}>Add to cart</button>
              <button className="text-sm" onClick={() => setQuick(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
