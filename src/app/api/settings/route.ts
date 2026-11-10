import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { projectSettings } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureBootstrapped();
  const rows = await db.select().from(projectSettings).limit(1);
  return NextResponse.json(rows[0] ?? {});
}

export async function PATCH(req: NextRequest) {
  await ensureBootstrapped();
  const body = await req.json();
  await db.update(projectSettings).set({ ...body, updatedAt: new Date().toISOString() }).where(sql`id = 1`);
  return NextResponse.json({ ok: true });
}
