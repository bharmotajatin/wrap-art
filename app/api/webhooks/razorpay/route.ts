import { db } from "@/lib/db/client";
import { coupons, inventoryLogs, orderItems, orderTrackingEvents, orders, productVariants } from "@/lib/db/schema";
import { getPaymentProvider } from "@/lib/payments";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const provider = getPaymentProvider("razorpay");
  const valid = provider.verifySignature({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id ?? body.paymentId,
    signature: body.razorpay_signature ?? body.signature,
  });
  if (!valid) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  const [order] = await db.select().from(orders).where(eq(orders.paymentId, body.razorpay_order_id));
  if (!order) return NextResponse.json({ error: "Order missing" }, { status: 404 });
  if (order.paymentStatus === "paid") return NextResponse.json({ ok: true });
  await db.update(orders).set({ paymentStatus: "paid", status: "paid", paymentId: body.razorpay_payment_id ?? order.paymentId }).where(eq(orders.id, order.id));
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  for (const item of items) {
    if (!item.variantId) continue;
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId));
    if (!variant) continue;
    await db.update(productVariants).set({ stock: Math.max(0, variant.stock - item.quantity) }).where(eq(productVariants.id, variant.id));
    await db.insert(inventoryLogs).values({ variantId: variant.id, change: -item.quantity, reason: `order ${order.orderNumber}` });
  }
  if (order.couponCode) {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, order.couponCode));
    if (coupon) await db.update(coupons).set({ usedCount: coupon.usedCount + 1 }).where(eq(coupons.id, coupon.id));
  }
  await db.insert(orderTrackingEvents).values({ orderId: order.id, status: "paid", note: "Payment captured" });
  return NextResponse.json({ ok: true });
}
