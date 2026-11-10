import { NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { constructionPhases, materialPurchases, expenses } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureBootstrapped();
  const phases = await db.select().from(constructionPhases).orderBy(constructionPhases.sortOrder);
  const result = await Promise.all(phases.map(async (phase) => {
    const matSpend = await db.select({ t: sql<number>`COALESCE(SUM(total_amount), 0)` }).from(materialPurchases).where(sql`phase_id = ${phase.id}`);
    const expSpend = await db.select({ t: sql<number>`COALESCE(SUM(amount), 0)` }).from(expenses).where(sql`phase_id = ${phase.id}`);
    const actualSpend = (matSpend[0]?.t ?? 0) + (expSpend[0]?.t ?? 0);
    return { ...phase, actualSpend };
  }));
  return NextResponse.json(result);
}
