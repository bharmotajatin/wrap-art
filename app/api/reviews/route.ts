import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { orderItems, orders, reviews } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().min(2),
  body: z.string().min(4),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const purchased = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, session.user.id), eq(orderItems.productId, parsed.data.productId)));
  if (!purchased.length) return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  await db.insert(reviews).values({ ...parsed.data, userId: session.user.id, isApproved: false });
  return NextResponse.json({ ok: true, pending: true });
}
