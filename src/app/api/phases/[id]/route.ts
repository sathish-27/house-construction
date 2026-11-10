import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { constructionPhases } from "@/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const phaseSchema = z.object({
  name: z.string().optional(),
  allocatedBudget: z.number().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureBootstrapped();
  const { id } = await params;
  const body = await req.json();
  const data = phaseSchema.parse(body);
  await db.update(constructionPhases).set(data).where(sql`id = ${parseInt(id)}`);
  return NextResponse.json({ ok: true });
}
