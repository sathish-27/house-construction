import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { dailyLogs, dailyLabourEntries, materialUsages } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const labourEntrySchema = z.object({
  labourRoleId: z.number(),
  roleNameSnapshot: z.string(),
  workerCount: z.number().int().min(0),
  shiftMultiplier: z.number().default(1),
  dailyRate: z.number().min(0),
  extraAllowance: z.number().min(0).default(0),
  paymentStatus: z.enum(["Paid", "Pending"]).default("Pending"),
  notes: z.string().default(""),
});

const usageSchema = z.object({
  materialId: z.number(),
  quantity: z.number().min(0),
  notes: z.string().default(""),
});

const dailyLogSchema = z.object({
  logDate: z.string(),
  phaseId: z.number().nullable().optional(),
  workSummary: z.string().default(""),
  workAreas: z.string().default(""),
  weather: z.string().default(""),
  issuesBlockers: z.string().default(""),
  labourEntries: z.array(labourEntrySchema).default([]),
  materialUsages: z.array(usageSchema).default([]),
});

export async function GET(req: NextRequest) {
  await ensureBootstrapped();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = (page - 1) * limit;

  const logs = await db.select().from(dailyLogs).orderBy(desc(dailyLogs.logDate)).limit(limit).offset(offset);
  const withEntries = await Promise.all(logs.map(async (log) => {
    const entries = await db.select().from(dailyLabourEntries).where(sql`daily_log_id = ${log.id}`);
    const usages = await db.select().from(materialUsages).where(sql`daily_log_id = ${log.id}`);
    const totalWorkers = entries.reduce((s, e) => s + e.workerCount, 0);
    const totalCost = entries.reduce((s, e) => s + e.totalCost, 0);
    return { ...log, labourEntries: entries, materialUsages: usages, totalWorkers, totalCost };
  }));

  return NextResponse.json({ logs: withEntries, page, limit });
}

export async function POST(req: NextRequest) {
  await ensureBootstrapped();
  const body = await req.json();
  const data = dailyLogSchema.parse(body);
  const now = new Date().toISOString();

  // Upsert daily log
  const existing = await db.select().from(dailyLogs).where(sql`log_date = ${data.logDate}`).limit(1);

  let logId: number;
  if (existing.length > 0) {
    logId = existing[0].id;
    await db.update(dailyLogs).set({
      phaseId: data.phaseId ?? null,
      workSummary: data.workSummary,
      workAreas: data.workAreas,
      weather: data.weather,
      issuesBlockers: data.issuesBlockers,
      updatedAt: now,
    }).where(sql`id = ${logId}`);
    // Delete existing entries to replace
    await db.delete(dailyLabourEntries).where(sql`daily_log_id = ${logId}`);
    await db.delete(materialUsages).where(sql`daily_log_id = ${logId}`);
  } else {
    const result = await db.insert(dailyLogs).values({
      logDate: data.logDate,
      phaseId: data.phaseId ?? null,
      workSummary: data.workSummary,
      workAreas: data.workAreas,
      weather: data.weather,
      issuesBlockers: data.issuesBlockers,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: dailyLogs.id });
    logId = result[0].id;
  }

  // Insert labour entries (skip 0-count rows)
  const activeEntries = data.labourEntries.filter(e => e.workerCount > 0);
  for (const entry of activeEntries) {
    const totalCost = entry.workerCount * entry.shiftMultiplier * entry.dailyRate + entry.extraAllowance;
    await db.insert(dailyLabourEntries).values({
      dailyLogId: logId,
      labourRoleId: entry.labourRoleId,
      roleNameSnapshot: entry.roleNameSnapshot,
      workerCount: entry.workerCount,
      shiftMultiplier: entry.shiftMultiplier,
      dailyRate: entry.dailyRate,
      extraAllowance: entry.extraAllowance,
      totalCost,
      paymentStatus: entry.paymentStatus,
      notes: entry.notes,
    });
  }

  // Insert material usages
  for (const usage of data.materialUsages.filter(u => u.quantity > 0)) {
    await db.insert(materialUsages).values({
      usageDate: data.logDate,
      materialId: usage.materialId,
      dailyLogId: logId,
      quantity: usage.quantity,
      notes: usage.notes,
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true, logId });
}
