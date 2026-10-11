import { db } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { couponDiscount } from "@/lib/pricing";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ code: z.string(), subtotal: z.number(), itemCount: z.number().default(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, parsed.data.code.toUpperCase()));
  if (!coupon) return NextResponse.json({ ok: false, error: "Invalid code", discount: 0 }, { status: 404 });
  const result = couponDiscount(parsed.data.subtotal, coupon, parsed.data.itemCount);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
