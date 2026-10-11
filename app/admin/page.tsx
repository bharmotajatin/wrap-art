import { db } from "@/lib/db/client";
import { orders, productVariants, products } from "@/lib/db/schema";
import { formatInr } from "@/lib/pricing";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";

export default async function AdminHome() {
  const [{ revenue }] = await db.select({ revenue: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(eq(orders.paymentStatus, "paid"));
  const low = await db.select().from(productVariants).where(sql`${productVariants.stock} < 3`).limit(5);
  const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8);
  const catalog = await db.select().from(products).limit(8);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <p>Paid revenue {formatInr(Number(revenue))}</p>
      <section>
        <h2 className="font-medium">Low stock</h2>
        <ul className="text-sm">{low.map((row) => <li key={row.id}>{row.sku} · {row.stock}</li>)}</ul>
      </section>
      <section>
        <h2 className="font-medium">Orders</h2>
        <ul className="text-sm">{recent.map((order) => <li key={order.id}>{order.orderNumber} · {order.status}</li>)}</ul>
      </section>
      <section>
        <h2 className="font-medium">Products</h2>
        <ul className="text-sm">{catalog.map((product) => <li key={product.id}><Link href={`/products/${product.slug}`}>{product.title}</Link></li>)}</ul>
      </section>
    </div>
  );
}
