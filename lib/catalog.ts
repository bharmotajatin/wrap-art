import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "./db/client";
import {
  categories,
  deviceModels,
  productImages,
  productVariants,
  products,
  reviews,
} from "./db/schema";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug));
  return row ?? null;
}

export type CatalogFilters = {
  categorySlug?: string;
  q?: string;
  sort?: string;
  min?: number;
  max?: number;
  color?: string;
  brand?: string;
  device?: string;
  page?: number;
  pageSize?: number;
};

export async function queryProducts(filters: CatalogFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 8;
  const conditions = [eq(products.isActive, true)];
  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return { items: [], total: 0, page, pageSize };
    const children = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, category.id));
    const ids = [category.id, ...children.map((c) => c.id)];
    conditions.push(sql`${products.categoryId} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
  }
  if (filters.q) conditions.push(like(products.title, `%${filters.q}%`));
  if (filters.min) conditions.push(sql`${products.basePrice} >= ${filters.min}`);
  if (filters.max) conditions.push(sql`${products.basePrice} <= ${filters.max}`);
  if (filters.brand) conditions.push(eq(products.brandTag, filters.brand));

  const order =
    filters.sort === "price-asc"
      ? asc(products.basePrice)
      : filters.sort === "price-desc"
        ? desc(products.basePrice)
        : filters.sort === "newest"
          ? desc(products.createdAt)
          : filters.sort === "rating"
            ? desc(products.avgRating)
            : desc(products.isFeatured);

  const where = and(...conditions);
  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(where);

  const items = [];
  for (const product of rows) {
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder));
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));
    if (filters.color && !variants.some((v) => v.color === filters.color)) continue;
    if (filters.device && !variants.some((v) => v.deviceModel === filters.device)) continue;
    items.push({ ...product, images, variants });
  }
  return { items, total: Number(count), page, pageSize };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug));
  if (!product) return null;
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));
  const productReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.isApproved, true)));
  const [category] = product.categoryId
    ? await db.select().from(categories).where(eq(categories.id, product.categoryId))
    : [];
  const related = product.categoryId
    ? await db
        .select()
        .from(products)
        .where(and(eq(products.categoryId, product.categoryId), eq(products.isActive, true)))
        .limit(8)
    : [];
  return { ...product, images, variants, reviews: productReviews, category, related };
}

export async function searchSuggestions(q: string) {
  if (!q.trim()) return { products: [], collections: [] };
  const productRows = await db
    .select({ title: products.title, slug: products.slug })
    .from(products)
    .where(or(like(products.title, `%${q}%`), like(products.brandTag, `%${q}%`)))
    .limit(6);
  const collectionRows = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .where(like(categories.name, `%${q}%`))
    .limit(4);
  return { products: productRows, collections: collectionRows };
}

export async function listDeviceModels() {
  return db.select().from(deviceModels).orderBy(asc(deviceModels.brand), asc(deviceModels.modelName));
}
