import { db } from "@/lib/db/client";
import { categories, products } from "@/lib/db/schema";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const productRows = await db.select({ slug: products.slug }).from(products);
  const categoryRows = await db.select({ slug: categories.slug }).from(categories);
  return [
    { url: base },
    ...categoryRows.map((row) => ({ url: `${base}/collections/${row.slug}` })),
    ...productRows.map((row) => ({ url: `${base}/products/${row.slug}` })),
  ];
}
