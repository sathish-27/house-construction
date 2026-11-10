import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { materialPurchases } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureBootstrapped();
  const { id } = await params;
  await db.delete(materialPurchases).where(sql`id = ${parseInt(id)}`);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureBootstrapped();
  const { id } = await params;
  const body = await req.json();
  await db.update(materialPurchases).set(body).where(sql`id = ${parseInt(id)}`);
  return NextResponse.json({ ok: true });
}
