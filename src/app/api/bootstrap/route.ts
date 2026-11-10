import { NextResponse } from "next/server";
import { ensureBootstrapped } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureBootstrapped();
  return NextResponse.json({ ok: true });
}
