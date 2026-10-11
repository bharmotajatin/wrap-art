import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { coupons, orderItems, orderTrackingEvents, orders, productVariants } from "@/lib/db/schema";
import { couponDiscount, orderTotals } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  lines: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })).min(1),
  couponCode: z.string().optional(),
  provider: z.enum(["razorpay", "stripe", "cod"]).default("razorpay"),
  address: z.object({
    line1: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(6),
    phone: z.string().min(10),
  }),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Check address and cart" }, { status: 400 });
  const session = await auth();
  let subtotal = 0;
  const snapshots = [];
  for (const line of parsed.data.lines) {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, line.variantId));
    if (!variant || variant.stock < line.quantity) {
      return NextResponse.json({ error: "An item is out of stock" }, { status: 409 });
    }
    const { products } = await import("@/lib/db/schema");
    const [product] = await db.select().from(products).where(eq(products.id, variant.productId));
    const unit = variant.priceOverride ?? product?.basePrice ?? 0;
    subtotal += unit * line.quantity;
    snapshots.push({ variant, product, unit, quantity: line.quantity });
  }
  let discount = 0;
  if (parsed.data.couponCode) {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, parsed.data.couponCode.toUpperCase()));
    const result = couponDiscount(subtotal, coupon ?? null, snapshots.reduce((n, s) => n + s.quantity, 0));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    discount = result.discount;
  }
  const totals = orderTotals(subtotal, discount);
  const orderNumber = `WA${Date.now().toString().slice(-8)}`;
  const [order] = await db
    .insert(orders)
    .values({
      userId: session?.user?.id,
      guestEmail: parsed.data.email,
      guestPhone: parsed.data.address.phone,
      orderNumber,
      subtotal,
      discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      couponCode: parsed.data.couponCode,
      paymentProvider: parsed.data.provider,
      paymentStatus: parsed.data.provider === "cod" ? "cod" : "pending",
      status: parsed.data.provider === "cod" ? "paid" : "pending",
      addressSnapshot: JSON.stringify(parsed.data.address),
    })
    .returning();
  await db.insert(orderItems).values(
    snapshots.map((snap) => ({
      orderId: order.id,
      variantId: snap.variant.id,
      productId: snap.product?.id,
      titleSnapshot: `${snap.product?.title ?? "Skin"} · ${snap.variant.deviceModel} · ${snap.variant.color}`,
      priceSnapshot: snap.unit,
      quantity: snap.quantity,
    })),
  );
  await db.insert(orderTrackingEvents).values({ orderId: order.id, status: order.status, note: "Order placed" });
  if (parsed.data.provider === "cod") {
    for (const snap of snapshots) {
      await db.update(productVariants).set({ stock: snap.variant.stock - snap.quantity }).where(eq(productVariants.id, snap.variant.id));
    }
    return NextResponse.json({ orderId: order.id, orderNumber, cod: true });
  }
  const provider = getPaymentProvider(parsed.data.provider === "stripe" ? "stripe" : "razorpay");
  const gateway = await provider.createOrder({ amount: totals.total, receipt: orderNumber });
  await db.update(orders).set({ paymentId: gateway.id }).where(eq(orders.id, order.id));
  return NextResponse.json({
    orderId: order.id,
    orderNumber,
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    gatewayOrderId: gateway.id,
    amount: totals.total,
    demo: gateway.id.startsWith("order_demo_") || gateway.id.startsWith("stripe_demo_"),
  });
}
