import { db } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().email() }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  if (user) {
    const token = crypto.randomUUID();
    await db.insert(passwordResetTokens).values({
      email: user.email,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 30),
    });
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, devToken: token });
    }
  }
  return NextResponse.json({ ok: true });
}
