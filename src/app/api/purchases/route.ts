import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { materialPurchases, materials, vendors, constructionPhases } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const purchaseSchema = z.object({
  purchaseDate: z.string(),
  materialId: z.number(),
  vendorId: z.number().nullable().optional(),
  phaseId: z.number().nullable().optional(),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  transportCost: z.number().min(0).default(0),
  gstAmount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  paymentStatus: z.enum(["Paid", "Partial", "Pending"]),
  paymentMode: z.string().default("Cash"),
  invoiceNumber: z.string().default(""),
  notes: z.string().default(""),
});

export async function GET() {
  await ensureBootstrapped();
  const rows = await db.select({
    purchase: materialPurchases,
    materialName: materials.name,
    materialUnit: materials.unit,
    vendorName: vendors.name,
    phaseName: constructionPhases.name,
  }).from(materialPurchases)
    .leftJoin(materials, sql`material_purchases.material_id = materials.id`)
    .leftJoin(vendors, sql`material_purchases.vendor_id = vendors.id`)
    .leftJoin(constructionPhases, sql`material_purchases.phase_id = construction_phases.id`)
    .orderBy(desc(materialPurchases.purchaseDate));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureBootstrapped();
  const body = await req.json();
  const data = purchaseSchema.parse(body);
  const totalAmount = data.quantity * data.unitPrice + data.transportCost + data.gstAmount;
  const result = await db.insert(materialPurchases).values({
    ...data,
    totalAmount,
    vendorId: data.vendorId ?? null,
    phaseId: data.phaseId ?? null,
    createdAt: new Date().toISOString(),
  }).returning();
  return NextResponse.json(result[0]);
}
