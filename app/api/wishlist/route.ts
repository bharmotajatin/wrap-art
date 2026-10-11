import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { wishlistAlerts, wishlists } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  email: z.string().email().optional(),
  alert: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (parsed.data.alert && parsed.data.email) {
    await db.insert(wishlistAlerts).values({ email: parsed.data.email, variantId: parsed.data.variantId });
    return NextResponse.json({ ok: true });
  }
  const session = await auth();
  if (!session?.user?.id || !parsed.data.productId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  await db.insert(wishlists).values({ userId: session.user.id, productId: parsed.data.productId }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const parsed = schema.safeParse(await req.json());
  if (!session?.user?.id || !parsed.success || !parsed.data.productId) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }
  await db.delete(wishlists).where(and(eq(wishlists.userId, session.user.id), eq(wishlists.productId, parsed.data.productId)));
  return NextResponse.json({ ok: true });
}
