import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { membershipPlans, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatInr } from "@/lib/pricing";

export default async function MembershipPage() {
  const session = await auth();
  const [user] = await db.select().from(users).where(eq(users.id, session!.user.id));
  const plans = await db.select().from(membershipPlans);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Gold membership</h1>
      <p className="mt-2 text-sm">{user?.isGoldMember ? "Your Gold plan is active." : "You are on the standard plan."}</p>
      {plans.map((plan) => (
        <article key={plan.id} className="glass mt-4 rounded-3xl p-4">
          <h2>{plan.name}</h2>
          <p>{formatInr(plan.price)} / {plan.durationMonths} months</p>
          <ul className="mt-2 text-sm">{JSON.parse(plan.perks).map((perk: string) => <li key={perk}>{perk}</li>)}</ul>
        </article>
      ))}
    </div>
  );
}
