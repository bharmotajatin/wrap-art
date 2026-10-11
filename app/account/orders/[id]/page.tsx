import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { orderItems, orderTrackingEvents, orders, returnRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const session = await auth();
  const [order] = await db.select().from(orders).where(eq(orders.id, params.id));
  if (!order || order.userId !== session?.user.id) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const events = await db.select().from(orderTrackingEvents).where(eq(orderTrackingEvents.orderId, order.id));
  async function requestReturn(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");
    await db.insert(returnRequests).values({ orderId: order.id, reason: String(formData.get("reason")), status: "requested" });
  }
  return (
    <div>
      <h1 className="text-3xl font-semibold">{order.orderNumber}</h1>
      <ol className="mt-4 space-y-2 border-l pl-4 text-sm">
        {events.map((event) => <li key={event.id}>{event.status} — {event.note}</li>)}
      </ol>
      <ul className="mt-4 text-sm">{items.map((item) => <li key={item.id}>{item.titleSnapshot} × {item.quantity}</li>)}</ul>
      {order.status === "delivered" && (
        <form action={requestReturn} className="mt-4 space-y-2">
          <textarea name="reason" required className="w-full rounded border bg-transparent p-2" placeholder="Return reason" />
          <button className="rounded-full border px-3 py-1">Request return</button>
        </form>
      )}
    </div>
  );
}
