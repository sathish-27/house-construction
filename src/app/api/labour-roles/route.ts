import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { labourRoles } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureBootstrapped();
  return NextResponse.json(await db.select().from(labourRoles).orderBy(labourRoles.sortOrder));
}

export async function PATCH(req: NextRequest) {
  await ensureBootstrapped();
  const { id, defaultDailyRate } = await req.json();
  await db.update(labourRoles).set({ defaultDailyRate }).where(sql`id = ${id}`);
  return NextResponse.json({ ok: true });
}
