import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { expenses, vendors, constructionPhases } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const expenseSchema = z.object({
  expenseDate: z.string(),
  title: z.string().min(1),
  category: z.string().default("Other"),
  phaseId: z.number().nullable().optional(),
  vendorId: z.number().nullable().optional(),
  amount: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  paymentStatus: z.enum(["Paid", "Partial", "Pending"]),
  paymentMode: z.string().default("Cash"),
  referenceNumber: z.string().default(""),
  notes: z.string().default(""),
});

export async function GET() {
  await ensureBootstrapped();
  const rows = await db.select({
    expense: expenses,
    vendorName: vendors.name,
    phaseName: constructionPhases.name,
  }).from(expenses)
    .leftJoin(vendors, sql`expenses.vendor_id = vendors.id`)
    .leftJoin(constructionPhases, sql`expenses.phase_id = construction_phases.id`)
    .orderBy(desc(expenses.expenseDate));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureBootstrapped();
  const body = await req.json();
  const data = expenseSchema.parse(body);
  const result = await db.insert(expenses).values({ ...data, vendorId: data.vendorId ?? null, phaseId: data.phaseId ?? null, createdAt: new Date().toISOString() }).returning();
  return NextResponse.json(result[0]);
}
