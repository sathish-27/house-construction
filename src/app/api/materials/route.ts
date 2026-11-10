import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { materials, materialPurchases, materialUsages } from "@/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const materialSchema = z.object({
  name: z.string().min(1),
  category: z.string().default(""),
  unit: z.string().default("nos"),
  lowStockThreshold: z.number().default(0),
  notes: z.string().default(""),
});

export async function GET() {
  await ensureBootstrapped();
  const allMats = await db.select().from(materials);
  const purchaseSums = await db.select({ materialId: materialPurchases.materialId, qty: sql<number>`COALESCE(SUM(quantity), 0)`, spent: sql<number>`COALESCE(SUM(total_amount), 0)` }).from(materialPurchases).groupBy(materialPurchases.materialId);
  const usageSums = await db.select({ materialId: materialUsages.materialId, qty: sql<number>`COALESCE(SUM(quantity), 0)` }).from(materialUsages).groupBy(materialUsages.materialId);

  return NextResponse.json(allMats.map(m => {
    const purchased = purchaseSums.find(p => p.materialId === m.id)?.qty ?? 0;
    const totalSpent = purchaseSums.find(p => p.materialId === m.id)?.spent ?? 0;
    const consumed = usageSums.find(u => u.materialId === m.id)?.qty ?? 0;
    const remaining = purchased - consumed;
    return { ...m, purchased, consumed, remaining, totalSpent, isLowStock: (m.lowStockThreshold ?? 0) > 0 && remaining <= (m.lowStockThreshold ?? 0) };
  }));
}

export async function POST(req: NextRequest) {
  await ensureBootstrapped();
  const body = await req.json();
  const data = materialSchema.parse(body);
  const result = await db.insert(materials).values({ ...data, createdAt: new Date().toISOString() }).returning();
  return NextResponse.json(result[0]);
}
