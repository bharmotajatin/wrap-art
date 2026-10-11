"use client";

import { formatInr, percentOff } from "@/lib/pricing";
import { useShop } from "@/lib/store";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "../ui/Toast";

type Variant = { id: string; deviceModel: string; color: string; sku: string; stock: number; priceOverride: number | null };
type ImageRow = { url: string; altText: string | null; color: string | null };
type Review = { id: string; rating: number; title: string; body: string };

export function ProductDetail({
  product,
}: {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    basePrice: number;
    compareAtPrice: number | null;
    material: string | null;
    brandTag: string | null;
    images: ImageRow[];
    variants: Variant[];
    reviews: Review[];
    avgRating: number;
    reviewCount: number;
  };
}) {
  const shop = useShop();
  const toast = useToast();
  const router = useRouter();
  const [modelQuery, setModelQuery] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("Description");
  const [notify, setNotify] = useState(false);
  const models = useMemo(() => Array.from(new Set(product.variants.map((v) => v.deviceModel))).filter((name) => name.toLowerCase().includes(modelQuery.toLowerCase())), [product.variants, modelQuery]);
  const colors = Array.from(new Set(product.variants.filter((v) => v.deviceModel === model).map((v) => v.color)));
  const variant = product.variants.find((v) => v.deviceModel === model && v.color === color);
  const price = variant?.priceOverride ?? product.basePrice;
  const image = product.images.find((img) => img.color === color) ?? product.images[0];
  const wished = shop.wishlist.includes(product.id);

  function add(goCheckout = false) {
    if (!variant) return;
    if (variant.stock < 1) return setNotify(true);
    shop.add({
      variantId: variant.id,
      productSlug: product.slug,
      title: product.title,
      deviceModel: variant.deviceModel,
      color: variant.color,
      unitPrice: price,
      quantity: Math.min(qty, variant.stock),
      stock: variant.stock,
      image: image?.url ?? "",
    });
    toast("Added to cart");
    if (goCheckout) router.push("/checkout");
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl">
          {image && <Image src={image.url} alt={image.altText ?? product.title} fill className="object-cover" priority sizes="50vw" />}
        </div>
        <div className="mt-3 flex gap-2">
          {product.images.map((img) => (
            <button key={img.url} className="relative h-16 w-16 overflow-hidden rounded-xl" onClick={() => img.color && setColor(img.color)}>
              <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm text-[var(--muted)]">{product.brandTag}</p>
        <h1 className="text-3xl font-semibold">{product.title}</h1>
        <p className="mt-2">{formatInr(price)} {product.compareAtPrice && <span className="text-[var(--muted)] line-through">{formatInr(product.compareAtPrice)}</span>} <span>{percentOff(price, product.compareAtPrice)}% off</span></p>
        <p className="text-sm">Rating {(product.avgRating / 10).toFixed(1)} · {product.reviewCount} reviews</p>
        <label className="mt-4 block text-sm">Device model
          <input className="mt-1 w-full rounded-xl border bg-transparent p-2" placeholder="Search  models" value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} />
        </label>
        <div className="mt-2 max-h-40 overflow-auto rounded-xl border p-2 text-sm">
          {models.slice(0, 40).map((name) => (
            <button key={name} className={`block w-full rounded px-2 py-1 text-left ${model === name ? "bg-[var(--fg)] text-[var(--bg)]" : ""}`} onClick={() => setModel(name)}>{name}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((name) => {
            const row = product.variants.find((v) => v.deviceModel === model && v.color === name);
            const out = !row || row.stock < 1;
            return (
              <button key={name} disabled={out} className={`rounded-full border px-3 py-1 text-sm ${color === name ? "bg-[var(--fg)] text-[var(--bg)]" : ""} ${out ? "line-through opacity-50" : ""}`} onClick={() => setColor(name)}>
                {name}
              </button>
            );
          })}
        </div>
        {variant && <p className="mt-2 text-sm">SKU {variant.sku} · {variant.stock} in stock</p>}
        <div className="mt-3 flex items-center gap-2">
          <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
          <input aria-label="Quantity" className="w-16 rounded border bg-transparent p-1 text-center" value={qty} onChange={(e) => setQty(Math.min(variant?.stock || 1, Math.max(1, Number(e.target.value) || 1)))} />
          <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(variant?.stock || q, q + 1))}>+</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={!variant} className="rounded-full bg-[var(--accent)] px-5 py-2 text-white disabled:opacity-50" onClick={() => add(false)}>
            {variant ? (variant.stock ? "Add to cart" : "Notify me") : "Select device model"}
          </button>
          <button disabled={!variant || !variant.stock} className="rounded-full border px-5 py-2" onClick={() => add(true)}>Buy now</button>
          <button aria-label="Wishlist" onClick={() => shop.toggleWish(product.id)}><Heart fill={wished ? "currentColor" : "none"} /></button>
        </div>
        <div className="mt-6 flex gap-3 text-sm">
          {["Description", "Material & Care", "Shipping & Returns", "Reviews"].map((name) => (
            <button key={name} className={tab === name ? "underline" : ""} onClick={() => setTab(name)}>{name}</button>
          ))}
        </div>
        <div className="mt-3 text-sm leading-6">
          {tab === "Description" && product.description}
          {tab === "Material & Care" && `${product.material}. Wipe with a dry cloth. Avoid prolonged heat.`}
          {tab === "Shipping & Returns" && "Ships in 2–4 days. Returns within 7 days of delivery for unused skins."}
          {tab === "Reviews" && (
            <ul>
              {product.reviews.map((review) => (
                <li key={review.id}><strong>{review.title}</strong> · {review.rating}/5<p>{review.body}</p></li>
              ))}
              <ReviewForm productId={product.id} />
            </ul>
          )}
        </div>
      </div>
      {notify && (
        <form
          className="glass fixed bottom-6 left-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2 rounded-2xl p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: new FormData(e.currentTarget).get("email"), variantId: variant?.id, alert: true }) });
            toast("We will email you when it is back.");
            setNotify(false);
          }}
        >
          <p className="text-sm">Notify me</p>
          <input name="email" type="email" required className="mt-2 w-full rounded border bg-transparent p-2" />
          <button className="mt-2 text-sm underline">Save</button>
        </form>
      )}
    </div>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const toast = useToast();
  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const res = await fetch("/api/reviews", { method: "POST", body: JSON.stringify({ ...data, productId, rating: Number(data.rating) }) });
        toast(res.ok ? "Review submitted for approval." : "Sign in and purchase this item to review.");
      }}
    >
      <input name="title" required placeholder="Title" className="w-full rounded border bg-transparent p-2" />
      <input name="rating" type="number" min={1} max={5} required placeholder="Stars" className="w-full rounded border bg-transparent p-2" />
      <textarea name="body" required placeholder="Your review" className="w-full rounded border bg-transparent p-2" />
      <button className="rounded-full border px-3 py-1">Write a review</button>
    </form>
  );
}
