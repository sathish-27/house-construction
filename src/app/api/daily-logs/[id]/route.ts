import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { dailyLogs, dailyLabourEntries, materialUsages } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureBootstrapped();
  const { id } = await params;
  const logId = parseInt(id);
  await db.delete(dailyLabourEntries).where(sql`daily_log_id = ${logId}`);
  await db.delete(materialUsages).where(sql`daily_log_id = ${logId}`);
  await db.delete(dailyLogs).where(sql`id = ${logId}`);
  return NextResponse.json({ ok: true });
}
