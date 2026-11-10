import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { expenses } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureBootstrapped();
  const { id } = await params;
  await db.delete(expenses).where(sql`id = ${parseInt(id)}`);
  return NextResponse.json({ ok: true });
}
