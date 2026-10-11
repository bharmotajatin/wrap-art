import { db } from "@/lib/db/client";
import { newsletterSubscribers } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  await db.insert(newsletterSubscribers).values(parsed.data).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
