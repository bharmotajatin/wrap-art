import { ProductCard } from "@/components/product/ProductCard";
import { queryProducts } from "@/lib/catalog";
import Link from "next/link";

export default async function HomePage() {
  const { items } = await queryProducts({ pageSize: 8 }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 8 }));
  const tiles = [
    ["Mobile Skins", "/collections/mobile-skins"],
    ["Screen Guards", "/collections/screen-guards"],
    ["Laptop Skins", "/collections/laptop-skins"],
    ["Chargers & Cards", "/collections/chargers-cards"],
  ];
  return (
    <div className="space-y-12">
      <section className="glass rounded-[2rem] p-8 md:p-12">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Skins for the devices you carry</p>
        <h1 className="mt-3 max-w-xl text-4xl font-semibold md:text-6xl">Cut, pressed, and finished for 40+ models.</h1>
        <div className="mt-6 flex gap-3">
          <Link href="/collections/mobile-skins" className="rounded-full bg-[var(--fg)] px-5 py-2 text-[var(--bg)]">Shop mobile skins</Link>
          <Link href="/account/membership" className="rounded-full border px-5 py-2">Gold membership</Link>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Shop by category</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {tiles.map(([name, href]) => (
            <Link key={href} href={href} className="glass rounded-3xl p-6">{name}</Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Best sellers</h2>
        <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
          {items.map((product) => (
            <div key={product.id} className="min-w-[260px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
      <section className="glass rounded-3xl p-6 text-sm">
        “The camera cut is exact and the matte film does not peel at the corners.” — verified buyer
      </section>
    </div>
  );
}
