import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { vendors, materialPurchases, expenses, vendorPayments } from "@/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const vendorSchema = z.object({
  name: z.string().min(1),
  type: z.string().default("Material Supplier"),
  phone: z.string().default(""),
  notes: z.string().default(""),
});

export async function GET() {
  await ensureBootstrapped();
  const allVendors = await db.select().from(vendors);
  const result = await Promise.all(allVendors.map(async (v) => {
    const matBilled = await db.select({ t: sql<number>`COALESCE(SUM(total_amount), 0)`, p: sql<number>`COALESCE(SUM(paid_amount), 0)` }).from(materialPurchases).where(sql`vendor_id = ${v.id}`);
    const expBilled = await db.select({ t: sql<number>`COALESCE(SUM(amount), 0)`, p: sql<number>`COALESCE(SUM(paid_amount), 0)` }).from(expenses).where(sql`vendor_id = ${v.id}`);
    const advances = await db.select({ t: sql<number>`COALESCE(SUM(amount), 0)` }).from(vendorPayments).where(sql`vendor_id = ${v.id} AND payment_type = 'Advance'`);
    const totalBilled = (matBilled[0]?.t ?? 0) + (expBilled[0]?.t ?? 0);
    const totalPaid = (matBilled[0]?.p ?? 0) + (expBilled[0]?.p ?? 0);
    const totalAdvances = advances[0]?.t ?? 0;
    const pendingDue = totalBilled - totalPaid;
    return { ...v, totalBilled, totalPaid, totalAdvances, pendingDue };
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  await ensureBootstrapped();
  const body = await req.json();
  const data = vendorSchema.parse(body);
  const result = await db.insert(vendors).values({ ...data, createdAt: new Date().toISOString() }).returning();
  return NextResponse.json(result[0]);
}
