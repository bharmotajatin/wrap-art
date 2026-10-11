import { ProductCard } from "@/components/product/ProductCard";
import { queryProducts } from "@/lib/catalog";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const result = await queryProducts({ q: searchParams.q, pageSize: 12 });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Search {searchParams.q}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {result.items.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
