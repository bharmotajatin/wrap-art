import { ProductCard } from "@/components/product/ProductCard";
import { getCategoryBySlug, queryProducts } from "@/lib/catalog";
import { formatInr } from "@/lib/pricing";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  return { title: category?.name ?? "Collection", description: `Shop ${category?.name ?? "products"} at Wrap Art.` };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string; page?: string; brand?: string; color?: string; max?: string };
}) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();
  const page = Number(searchParams.page ?? 1);
  const result = await queryProducts({
    categorySlug: params.slug,
    sort: searchParams.sort,
    brand: searchParams.brand,
    color: searchParams.color,
    max: searchParams.max ? Number(searchParams.max) : undefined,
    page,
  });
  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams({ ...searchParams, ...patch });
    Array.from(next.entries()).forEach(([k, v]) => !v && next.delete(k));
    return `?${next.toString()}`;
  };
  return (
    <div>
      <h1 className="text-3xl font-semibold">{category.name}</h1>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {["featured", "price-asc", "price-desc", "newest", "rating"].map((sort) => (
          <Link key={sort} href={qs({ sort, page: "1" })} className="rounded-full border px-3 py-1">{sort}</Link>
        ))}
        <Link href={qs({ brand: "3M" })} className="rounded-full border px-3 py-1">3M</Link>
        <Link href={qs({ color: "Obsidian" })} className="rounded-full border px-3 py-1">Obsidian</Link>
        <Link href={qs({ max: "80000" })} className="rounded-full border px-3 py-1">Under {formatInr(80000)}</Link>
        <Link href={`/collections/${params.slug}`} className="underline">Clear filters</Link>
      </div>
      {result.items.length === 0 ? (
        <p className="mt-8">No products match. <Link href={`/collections/${params.slug}`}>Clear filters</Link></p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
      {page * result.pageSize < result.total && (
        <Link href={qs({ page: String(page + 1) })} className="mt-6 inline-block rounded-full border px-4 py-2">Load more</Link>
      )}
    </div>
  );
}
