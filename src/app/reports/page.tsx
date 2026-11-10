"use client";
import AppShell from "@/components/AppShell";
import { Download, FileText } from "lucide-react";

const REPORTS = [
  { type: "purchases", label: "Material Purchases", desc: "All material purchase records with vendor and payment details" },
  { type: "expenses", label: "Expenses", desc: "All other expenses with category and payment breakdown" },
  { type: "daily-logs", label: "Daily Work Logs", desc: "Daily labour logs with worker counts and costs" },
  { type: "stock", label: "Material Stock", desc: "Current stock levels, consumed quantities and low-stock status" },
];

export default function ReportsPage() {
  const handleDownload = (type: string) => {
    const a = document.createElement("a");
    a.href = `/api/reports/export?type=${type}`;
    a.download = `${type}.csv`;
    a.click();
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Reports & Export</h1>
          <p className="text-stone-500 text-sm mt-1">Download data as CSV for further analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORTS.map(r => (
            <div key={r.type} className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 flex items-start gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex-shrink-0">
                <FileText size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">{r.label}</h3>
                <p className="text-sm text-stone-500 mt-1">{r.desc}</p>
              </div>
              <button
                onClick={() => handleDownload(r.type)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
              >
                <Download size={14} /> CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
