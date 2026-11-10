"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { formatINR } from "@/lib/format";
import { Plus } from "lucide-react";

interface Vendor {
  id: number; name: string; type: string; phone: string; notes: string;
  totalBilled: number; totalPaid: number; totalAdvances: number; pendingDue: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vName, setVName] = useState("");
  const [vType, setVType] = useState("Material Supplier");
  const [vPhone, setVPhone] = useState("");
  const [vNotes, setVNotes] = useState("");

  const loadData = useCallback(async () => {
    const data = await fetch("/api/vendors").then(r => r.json());
    setVendors(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!vName.trim()) return;
    setSaving(true);
    await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: vName, type: vType, phone: vPhone, notes: vNotes }),
    });
    setSaving(false);
    setShowForm(false);
    setVName(""); setVPhone(""); setVNotes("");
    loadData();
  };

  const totalBilled = vendors.reduce((s, v) => s + v.totalBilled, 0);
  const totalPending = vendors.reduce((s, v) => s + v.pendingDue, 0);

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Vendors</h1>
            <p className="text-stone-500 text-sm mt-1">
              Total Billed: {formatINR(totalBilled)} · Pending: {formatINR(totalPending)}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Add Vendor
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 space-y-4 max-w-lg">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200">New Vendor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-stone-500 uppercase">Name *</label>
                <input value={vName} onChange={e => setVName(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  placeholder="Vendor / Supplier name" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Type</label>
                <select value={vType} onChange={e => setVType(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option>Material Supplier</option>
                  <option>Labour Contractor</option>
                  <option>Equipment Rental</option>
                  <option>Architect / Designer</option>
                  <option>Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Phone</label>
                <input value={vPhone} onChange={e => setVPhone(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-stone-500 uppercase">Notes</label>
                <input value={vNotes} onChange={e => setVNotes(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50">
                Add Vendor
              </button>
              <button onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 px-4 py-2.5 rounded-lg border border-stone-300">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">{v.name}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{v.type}</p>
                  {v.phone && <p className="text-xs text-stone-500 mt-1">📞 {v.phone}</p>}
                </div>
                {v.pendingDue > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Due</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-stone-100 dark:border-stone-700">
                <div>
                  <p className="text-xs text-stone-400">Total Billed</p>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">{formatINR(v.totalBilled)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Pending Due</p>
                  <p className={`font-semibold ${v.pendingDue > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatINR(v.pendingDue)}
                  </p>
                </div>
              </div>
              {v.notes && <p className="text-xs text-stone-400 mt-2 italic">{v.notes}</p>}
            </div>
          ))}
          {vendors.length === 0 && (
            <div className="col-span-3 text-center py-12 text-stone-400">No vendors yet.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
