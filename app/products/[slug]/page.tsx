import { ProductDetail } from "@/components/product/ProductDetail";
import { getProductBySlug } from "@/lib/catalog";
import { formatInr } from "@/lib/pricing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  return { title: product?.seoTitle ?? product?.title, description: product?.seoDescription ?? product?.description };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    offers: { "@type": "Offer", priceCurrency: "INR", price: product.basePrice / 100 },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail product={product} />
      <section className="mt-10">
        <h2 className="text-xl font-semibold">You may also like</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto text-sm">
          {product.related.filter((item) => item.id !== product.id).map((item) => (
            <a key={item.id} href={`/products/${item.slug}`} className="glass min-w-48 rounded-2xl p-3">{item.title}<br />{formatInr(item.basePrice)}</a>
          ))}
        </div>
      </section>
    </>
  );
}
