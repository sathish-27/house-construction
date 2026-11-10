"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { formatCompactINR, formatINR, formatDate } from "@/lib/format";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, Users, AlertCircle, Package, Hammer, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalBudget: number;
  totalMaterialSpend: number;
  totalLabourSpend: number;
  totalOtherExpenses: number;
  totalSpend: number;
  totalPaid: number;
  totalPending: number;
  todayLog: {
    totalWorkers: number;
    totalCost: number;
    workSummary: string;
    logDate: string;
  } | null;
  materialStock: Array<{
    id: number; name: string; unit: string;
    purchased: number; consumed: number; remaining: number; isLowStock: boolean;
  }>;
  phasesSummary: Array<{
    id: number; name: string; status: string;
    allocatedBudget: number; actualSpend: number;
  }>;
  spendSeries: Array<{ date: string; materials: number; labour: number; other: number }>;
  categoryBreakdown: Array<{ category: string; amount: number }>;
  recentDailyLogs: Array<{
    id: number; logDate: string; workSummary: string;
    totalWorkers: number; totalCost: number;
  }>;
}

const PIE_COLORS = ["#f59e0b", "#78716c", "#0ea5e9", "#10b981", "#f43f5e", "#8b5cf6"];

const statusColor: Record<string, string> = {
  "Not Started": "bg-stone-200 text-stone-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Completed": "bg-green-100 text-green-700",
  "On Hold": "bg-yellow-100 text-yellow-700",
};

function KpiCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className={`bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 flex items-start gap-4`}>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-400 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return <AppShell><div className="p-8 text-red-500">Failed to load dashboard data.</div></AppShell>;
  }

  const budgetPct = data.totalBudget > 0 ? Math.min(100, (data.totalSpend / data.totalBudget) * 100) : 0;
  const lowStockItems = data.materialStock.filter(m => m.isLowStock);

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">Overview of your construction project</p>
        </div>

        {/* Budget Progress */}
        {data.totalBudget > 0 && (
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Overall Budget Used</span>
              <span className="text-sm text-stone-500">{formatCompactINR(data.totalSpend)} / {formatCompactINR(data.totalBudget)}</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-1">{budgetPct.toFixed(1)}% used</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            title="Total Spend"
            value={formatCompactINR(data.totalSpend)}
            sub={`Paid: ${formatCompactINR(data.totalPaid)}`}
            icon={TrendingUp}
            color="bg-amber-500"
          />
          <KpiCard
            title="Today's Workers"
            value={data.todayLog ? String(data.todayLog.totalWorkers) : "—"}
            sub={data.todayLog ? `Cost: ${formatCompactINR(data.todayLog.totalCost)}` : "No log today"}
            icon={Users}
            color="bg-blue-500"
          />
          <KpiCard
            title="Pending Dues"
            value={formatCompactINR(data.totalPending)}
            sub="Total unpaid"
            icon={AlertCircle}
            color="bg-red-500"
          />
          <KpiCard
            title="Materials Spend"
            value={formatCompactINR(data.totalMaterialSpend)}
            sub="All purchases"
            icon={Package}
            color="bg-green-500"
          />
          <KpiCard
            title="Labour Spend"
            value={formatCompactINR(data.totalLabourSpend)}
            sub="All wages"
            icon={Hammer}
            color="bg-purple-500"
          />
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-red-500" />
              <span className="font-semibold text-red-700 dark:text-red-400">Low Stock Alerts ({lowStockItems.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(m => (
                <span key={m.id} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                  {m.name}: {m.remaining} {m.unit} left
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Spend Trend */}
          <div className="xl:col-span-2 bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">30-Day Spend Trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.spendSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => formatINR(Number(v))} labelFormatter={l => `Date: ${l}`} />
                <Legend />
                <Area type="monotone" dataKey="materials" name="Materials" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
                <Area type="monotone" dataKey="labour" name="Labour" stackId="1" stroke="#78716c" fill="#e7e5e4" />
                <Area type="monotone" dataKey="other" name="Other" stackId="1" stroke="#0ea5e9" fill="#e0f2fe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">Category Breakdown</h2>
            {data.categoryBreakdown.filter(c => c.amount > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown.filter(c => c.amount > 0)}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={(props) => { const p = props as { category?: string; percent?: number }; return `${p.category ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`; }}
                    labelLine={false}
                  >
                    {data.categoryBreakdown.filter(c => c.amount > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-stone-400">No spend data yet</div>
            )}
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Phase Progress</h2>
            <Link href="/phases" className="text-sm text-amber-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.phasesSummary.map(phase => {
              const pct = phase.allocatedBudget > 0
                ? Math.min(100, (phase.actualSpend / phase.allocatedBudget) * 100)
                : 0;
              return (
                <div key={phase.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-700 dark:text-stone-300 font-medium">{phase.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[phase.status] ?? "bg-stone-100 text-stone-600"}`}>
                        {phase.status}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500">
                      {formatCompactINR(phase.actualSpend)}
                      {phase.allocatedBudget > 0 && ` / ${formatCompactINR(phase.allocatedBudget)}`}
                    </span>
                  </div>
                  {phase.allocatedBudget > 0 && (
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${pct > 100 ? "bg-red-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Daily Logs */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Recent Daily Logs</h2>
            <Link href="/daily-log" className="text-sm text-amber-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentDailyLogs.length === 0 ? (
            <p className="text-stone-400 text-sm">No logs yet. <Link href="/daily-log" className="text-amber-600 hover:underline">Add today&apos;s work log.</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left py-2 px-3 text-stone-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-stone-500 font-medium">Summary</th>
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">Workers</th>
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">Labour Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentDailyLogs.map(log => (
                    <tr key={log.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                      <td className="py-2 px-3 text-stone-700 dark:text-stone-300 whitespace-nowrap">{formatDate(log.logDate)}</td>
                      <td className="py-2 px-3 text-stone-600 dark:text-stone-400 max-w-xs truncate">{log.workSummary || "—"}</td>
                      <td className="py-2 px-3 text-right text-stone-700 dark:text-stone-300">{log.totalWorkers}</td>
                      <td className="py-2 px-3 text-right text-stone-700 dark:text-stone-300">{formatINR(log.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
