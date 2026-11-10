import { NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import {
  projectSettings, constructionPhases, materialPurchases, materialUsages,
  dailyLogs, dailyLabourEntries, expenses, materials
} from "@/db/schema";

export const dynamic = "force-dynamic";
import { sql, desc, gte } from "drizzle-orm";

export async function GET() {
  await ensureBootstrapped();

  const settings = await db.select().from(projectSettings).limit(1);
  const totalBudget = settings[0]?.totalBudget ?? 0;

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Totals
  const matSpendRow = await db.select({ total: sql<number>`COALESCE(SUM(total_amount), 0)` }).from(materialPurchases);
  const matPaidRow = await db.select({ total: sql<number>`COALESCE(SUM(paid_amount), 0)` }).from(materialPurchases);
  const labourCostRow = await db.select({ total: sql<number>`COALESCE(SUM(total_cost), 0)` }).from(dailyLabourEntries);
  const expenseAmtRow = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(expenses);
  const expensePaidRow = await db.select({ total: sql<number>`COALESCE(SUM(paid_amount), 0)` }).from(expenses);

  const totalMaterialSpend = matSpendRow[0]?.total ?? 0;
  const totalLabourSpend = labourCostRow[0]?.total ?? 0;
  const totalOtherExpenses = expenseAmtRow[0]?.total ?? 0;
  const totalSpend = totalMaterialSpend + totalLabourSpend + totalOtherExpenses;
  const totalPaid = (matPaidRow[0]?.total ?? 0) + (expensePaidRow[0]?.total ?? 0);
  const totalPending = totalSpend - totalPaid;

  // Today's log
  const todayLogs = await db.select().from(dailyLogs).where(sql`log_date = ${today}`).limit(1);
  let todayLog = null;
  if (todayLogs.length > 0) {
    const entries = await db.select().from(dailyLabourEntries).where(sql`daily_log_id = ${todayLogs[0].id}`);
    const totalWorkers = entries.reduce((sum, e) => sum + e.workerCount, 0);
    const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);
    todayLog = { ...todayLogs[0], totalWorkers, totalCost };
  }

  // Material stock
  const allMaterials = await db.select().from(materials);
  const purchaseSums = await db.select({
    materialId: materialPurchases.materialId,
    total: sql<number>`COALESCE(SUM(quantity), 0)`
  }).from(materialPurchases).groupBy(materialPurchases.materialId);
  const usageSums = await db.select({
    materialId: materialUsages.materialId,
    total: sql<number>`COALESCE(SUM(quantity), 0)`
  }).from(materialUsages).groupBy(materialUsages.materialId);

  const materialStock = allMaterials.map(m => {
    const purchased = purchaseSums.find(p => p.materialId === m.id)?.total ?? 0;
    const consumed = usageSums.find(u => u.materialId === m.id)?.total ?? 0;
    const remaining = purchased - consumed;
    return { ...m, purchased, consumed, remaining, isLowStock: (m.lowStockThreshold ?? 0) > 0 && remaining <= (m.lowStockThreshold ?? 0) };
  });

  // Phases
  const phases = await db.select().from(constructionPhases).orderBy(constructionPhases.sortOrder);
  const phasesSummary = await Promise.all(phases.map(async (phase) => {
    const matSpend = await db.select({ t: sql<number>`COALESCE(SUM(total_amount), 0)` }).from(materialPurchases).where(sql`phase_id = ${phase.id}`);
    const expSpend = await db.select({ t: sql<number>`COALESCE(SUM(amount), 0)` }).from(expenses).where(sql`phase_id = ${phase.id}`);
    const actualSpend = (matSpend[0]?.t ?? 0) + (expSpend[0]?.t ?? 0);
    return { ...phase, actualSpend };
  }));

  // Last 30 days daily spend
  const last30Purchases = await db.select({
    date: materialPurchases.purchaseDate,
    amount: materialPurchases.totalAmount
  }).from(materialPurchases).where(gte(materialPurchases.purchaseDate, thirtyDaysAgo));

  const last30Labour = await db.select({
    date: dailyLogs.logDate,
    cost: dailyLabourEntries.totalCost,
    workers: dailyLabourEntries.workerCount
  }).from(dailyLabourEntries).leftJoin(dailyLogs, sql`daily_labour_entries.daily_log_id = daily_logs.id`).where(gte(dailyLogs.logDate, thirtyDaysAgo));

  const last30Expenses = await db.select({
    date: expenses.expenseDate,
    amount: expenses.amount
  }).from(expenses).where(gte(expenses.expenseDate, thirtyDaysAgo));

  // Build date map for time series
  const dateMap: Record<string, { materials: number; labour: number; other: number; workers: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    dateMap[d] = { materials: 0, labour: 0, other: 0, workers: 0 };
  }
  last30Purchases.forEach(p => { if (dateMap[p.date]) dateMap[p.date].materials += p.amount; });
  last30Labour.forEach(l => { if (l.date && dateMap[l.date]) { dateMap[l.date].labour += l.cost; dateMap[l.date].workers += l.workers; } });
  last30Expenses.forEach(e => { if (dateMap[e.date]) dateMap[e.date].other += e.amount; });

  const spendSeries = Object.entries(dateMap).map(([date, v]) => ({ date, ...v }));

  // Category breakdown
  const categoryBreakdown = [
    { category: "Raw Materials", amount: totalMaterialSpend },
    { category: "Labour / Wages", amount: totalLabourSpend },
    ...await db.select({ category: expenses.category, amount: sql<number>`SUM(amount)` }).from(expenses).groupBy(expenses.category)
  ];

  // Recent daily logs
  const recentLogs = await db.select().from(dailyLogs).orderBy(desc(dailyLogs.logDate)).limit(10);
  const recentDailyLogs = await Promise.all(recentLogs.map(async (log) => {
    const entries = await db.select().from(dailyLabourEntries).where(sql`daily_log_id = ${log.id}`);
    const totalWorkers = entries.reduce((s, e) => s + e.workerCount, 0);
    const totalCost = entries.reduce((s, e) => s + e.totalCost, 0);
    return { ...log, entries, totalWorkers, totalCost };
  }));

  return NextResponse.json({
    totalBudget, totalMaterialSpend, totalLabourSpend, totalOtherExpenses,
    totalSpend, totalPaid, totalPending, todayLog,
    materialStock, phasesSummary, spendSeries, categoryBreakdown, recentDailyLogs
  });
}
