import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function AddressesPage() {
  const session = await auth();
  const rows = await db.select().from(addresses).where(eq(addresses.userId, session!.user.id));
  async function add(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    await db.insert(addresses).values({
      userId: session.user.id,
      line1: String(formData.get("line1")),
      city: String(formData.get("city")),
      state: String(formData.get("state")),
      pincode: String(formData.get("pincode")),
      phone: String(formData.get("phone")),
      isDefault: rows.length === 0,
    });
    revalidatePath("/account/addresses");
  }
  return (
    <div>
      <h1 className="text-3xl font-semibold">Addresses</h1>
      <ul className="mt-4 space-y-2 text-sm">{rows.map((row) => <li key={row.id}>{row.line1}, {row.city} {row.pincode} {row.isDefault ? "· default" : ""}</li>)}</ul>
      <form action={add} className="mt-4 grid max-w-md gap-2">
        <input name="line1" required placeholder="Line 1" className="rounded border bg-transparent p-2" />
        <input name="city" required placeholder="City" className="rounded border bg-transparent p-2" />
        <input name="state" required placeholder="State" className="rounded border bg-transparent p-2" />
        <input name="pincode" required placeholder="Pincode" className="rounded border bg-transparent p-2" />
        <input name="phone" required placeholder="Phone" className="rounded border bg-transparent p-2" />
        <button className="rounded-full bg-[var(--fg)] px-4 py-2 text-[var(--bg)]">Save address</button>
      </form>
    </div>
  );
}
