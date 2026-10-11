import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function OrdersPage() {
  const session = await auth();
  const rows = await db.select().from(orders).where(eq(orders.userId, session!.user.id)).orderBy(desc(orders.createdAt));
  return (
    <div>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <ul className="mt-4 space-y-2">
        {rows.map((order) => (
          <li key={order.id} className="glass rounded-2xl p-3 text-sm">
            <Link href={`/account/orders/${order.id}`}>{order.orderNumber}</Link>
            <span className="ml-2 rounded-full bg-[var(--accent-2)] px-2 text-xs">{order.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
