import { db } from "@/lib/db/client";
import { orderTrackingEvents, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, params.id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const contact = body.phone || body.email;
  if (contact !== order.guestPhone && contact !== order.guestEmail) {
    return NextResponse.json({ error: "Details do not match" }, { status: 403 });
  }
  const events = await db.select().from(orderTrackingEvents).where(eq(orderTrackingEvents.orderId, order.id));
  return NextResponse.json({ orderNumber: order.orderNumber, status: order.status, events });
}
