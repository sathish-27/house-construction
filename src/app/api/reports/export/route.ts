import { NextRequest, NextResponse } from "next/server";
import { db, ensureBootstrapped } from "@/db";
import { materialPurchases, expenses, dailyLogs, dailyLabourEntries, materials, materialUsages } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const BOM = "\uFEFF";
  const escape = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return BOM + [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(",")).join("\n");
}

export async function GET(req: NextRequest) {
  await ensureBootstrapped();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "expenses";

  if (type === "purchases") {
    const rows = await db.select().from(materialPurchases).orderBy(desc(materialPurchases.purchaseDate));
    const csv = toCsv(
      ["Date", "Material ID", "Vendor ID", "Phase ID", "Quantity", "Unit Price", "Transport", "GST", "Total Amount", "Paid Amount", "Status", "Payment Mode", "Invoice No", "Notes"],
      rows.map(r => [r.purchaseDate, r.materialId, r.vendorId, r.phaseId, r.quantity, r.unitPrice, r.transportCost, r.gstAmount, r.totalAmount, r.paidAmount, r.paymentStatus, r.paymentMode, r.invoiceNumber, r.notes])
    );
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="purchases.csv"' } });
  }

  if (type === "expenses") {
    const rows = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
    const csv = toCsv(
      ["Date", "Title", "Category", "Phase ID", "Vendor ID", "Amount", "Paid Amount", "Status", "Payment Mode", "Reference No", "Notes"],
      rows.map(r => [r.expenseDate, r.title, r.category, r.phaseId, r.vendorId, r.amount, r.paidAmount, r.paymentStatus, r.paymentMode, r.referenceNumber, r.notes])
    );
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="expenses.csv"' } });
  }

  if (type === "daily-logs") {
    const logs = await db.select().from(dailyLogs).orderBy(desc(dailyLogs.logDate));
    const rows: (string | number | null)[][] = [];
    for (const log of logs) {
      const entries = await db.select().from(dailyLabourEntries).where(sql`daily_log_id = ${log.id}`);
      const totalWorkers = entries.reduce((s, e) => s + e.workerCount, 0);
      const totalCost = entries.reduce((s, e) => s + e.totalCost, 0);
      rows.push([log.logDate, log.phaseId, log.workSummary, log.weather, log.issuesBlockers, totalWorkers, totalCost]);
    }
    const csv = toCsv(["Date", "Phase ID", "Work Summary", "Weather", "Issues", "Total Workers", "Total Labour Cost (INR)"], rows);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="daily-logs.csv"' } });
  }

  if (type === "stock") {
    const allMats = await db.select().from(materials);
    const rows = await Promise.all(allMats.map(async (m) => {
      const p = await db.select({ qty: sql<number>`COALESCE(SUM(quantity), 0)` }).from(materialPurchases).where(sql`material_id = ${m.id}`);
      const u = await db.select({ qty: sql<number>`COALESCE(SUM(quantity), 0)` }).from(materialUsages).where(sql`material_id = ${m.id}`);
      return [m.name, m.category, m.unit, p[0]?.qty ?? 0, u[0]?.qty ?? 0, (p[0]?.qty ?? 0) - (u[0]?.qty ?? 0), m.lowStockThreshold];
    }));
    const csv = toCsv(["Material", "Category", "Unit", "Purchased", "Consumed", "Remaining", "Low Stock Alert At"], rows);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="stock.csv"' } });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
