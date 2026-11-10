"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { formatINR, formatDate, todayISO } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

interface Expense {
  id: number; expenseDate: string; title: string; category: string;
  amount: number; paidAmount: number; paymentStatus: string; paymentMode: string;
  referenceNumber: string; notes: string; phaseId: number | null; vendorId: number | null;
}
interface ExpenseRow { expense: Expense; vendorName: string | null; phaseName: string | null; }
interface Phase { id: number; name: string; }
interface Vendor { id: number; name: string; }

const CATEGORIES = ["Architecture / Design", "Legal / Permits", "Soil Test / Survey", "Equipment Hire", "Safety / PPE", "Site Utilities", "Transportation", "Miscellaneous", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eDate, setEDate] = useState(todayISO());
  const [eTitle, setETitle] = useState("");
  const [eCategory, setECategory] = useState("Other");
  const [ePhaseId, setEPhaseId] = useState<number | null>(null);
  const [eVendorId, setEVendorId] = useState<number | null>(null);
  const [eAmount, setEAmount] = useState(0);
  const [ePaid, setEPaid] = useState(0);
  const [eStatus, setEStatus] = useState<"Paid" | "Partial" | "Pending">("Pending");
  const [eMode, setEMode] = useState("Cash");
  const [eRef, setERef] = useState("");
  const [eNotes, setENotes] = useState("");

  const loadData = useCallback(async () => {
    const [expRes, phasesRes, vendorsRes] = await Promise.all([
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/phases").then(r => r.json()),
      fetch("/api/vendors").then(r => r.json()),
    ]);
    setExpenses(expRes);
    setPhases(phasesRes);
    setVendors(vendorsRes);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!eTitle.trim() || eAmount <= 0) return;
    setSaving(true);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expenseDate: eDate, title: eTitle, category: eCategory,
        phaseId: ePhaseId, vendorId: eVendorId, amount: eAmount,
        paidAmount: ePaid, paymentStatus: eStatus, paymentMode: eMode,
        referenceNumber: eRef, notes: eNotes,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setETitle(""); setEAmount(0); setEPaid(0); setERef(""); setENotes("");
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    loadData();
  };

  const totalAmount = expenses.reduce((s, { expense: e }) => s + e.amount, 0);
  const totalPaid = expenses.reduce((s, { expense: e }) => s + e.paidAmount, 0);

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Expenses</h1>
            <p className="text-stone-500 text-sm mt-1">
              Total: {formatINR(totalAmount)} · Paid: {formatINR(totalPaid)} · Pending: {formatINR(totalAmount - totalPaid)}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 space-y-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200">New Expense</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Date</label>
                <input type="date" value={eDate} onChange={e => setEDate(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-stone-500 uppercase">Title *</label>
                <input value={eTitle} onChange={e => setETitle(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  placeholder="e.g. Architect fees" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Category</label>
                <select value={eCategory} onChange={e => setECategory(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Phase</label>
                <select value={ePhaseId ?? ""} onChange={e => setEPhaseId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option value="">— None —</option>
                  {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Vendor</label>
                <select value={eVendorId ?? ""} onChange={e => setEVendorId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option value="">— None —</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Amount (₹) *</label>
                <input type="number" value={eAmount} onChange={e => setEAmount(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Paid Amount (₹)</label>
                <input type="number" value={ePaid} onChange={e => setEPaid(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Payment Status</label>
                <select value={eStatus} onChange={e => setEStatus(e.target.value as "Paid" | "Partial" | "Pending")}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option>Pending</option><option>Partial</option><option>Paid</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Payment Mode</label>
                <select value={eMode} onChange={e => setEMode(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option>Cash</option><option>UPI</option><option>NEFT</option><option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Reference No</label>
                <input value={eRef} onChange={e => setERef(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-stone-500 uppercase">Notes</label>
                <input value={eNotes} onChange={e => setENotes(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50">
                Save Expense
              </button>
              <button onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 px-4 py-2.5 rounded-lg border border-stone-300">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Phase</th>
                  <th className="text-right py-3 px-4 font-medium text-stone-500">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(({ expense: e, phaseName, vendorName }) => (
                  <tr key={e.id} className="border-t border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(e.expenseDate)}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-800 dark:text-stone-200">{e.title}</div>
                      {vendorName && <div className="text-xs text-stone-400">{vendorName}</div>}
                    </td>
                    <td className="py-3 px-4 text-stone-500">{e.category}</td>
                    <td className="py-3 px-4 text-stone-500">{phaseName || "—"}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(e.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.paymentStatus === "Paid" ? "bg-green-100 text-green-700" :
                        e.paymentStatus === "Partial" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{e.paymentStatus}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-stone-400">No expenses yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
