import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth();
  const recent = session?.user?.id
    ? await db.select().from(orders).where(eq(orders.userId, session.user.id)).orderBy(desc(orders.createdAt)).limit(5)
    : [];
  return (
    <div>
      <h1 className="text-3xl font-semibold">Hello {session?.user?.name}</h1>
      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/account/orders">Orders</Link>
        <Link href="/account/addresses">Addresses</Link>
        <Link href="/account/membership">Membership</Link>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {recent.map((order) => (
          <li key={order.id}><Link href={`/account/orders/${order.id}`}>{order.orderNumber}</Link> · {order.status}</li>
        ))}
      </ul>
    </div>
  );
}
