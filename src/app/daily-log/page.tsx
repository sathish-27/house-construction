"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { formatINR, formatDate, todayISO } from "@/lib/format";
import { Plus, Trash2, Save, ChevronLeft, ChevronRight } from "lucide-react";

interface LabourRole {
  id: number;
  name: string;
  defaultDailyRate: number;
  isActive: boolean;
}

interface Material {
  id: number;
  name: string;
  unit: string;
}

interface Phase {
  id: number;
  name: string;
}

interface LabourEntry {
  labourRoleId: number;
  roleNameSnapshot: string;
  workerCount: number;
  shiftMultiplier: number;
  dailyRate: number;
  extraAllowance: number;
  paymentStatus: "Paid" | "Pending";
  notes: string;
}

interface MaterialUsageEntry {
  materialId: number;
  quantity: number;
  notes: string;
}

interface DailyLogRecord {
  id: number;
  logDate: string;
  phaseId: number | null;
  workSummary: string;
  workAreas: string;
  weather: string;
  issuesBlockers: string;
  totalWorkers: number;
  totalCost: number;
  labourEntries: Array<{ roleNameSnapshot: string; workerCount: number; totalCost: number; paymentStatus: string }>;
  materialUsages: Array<{ materialId: number; quantity: number; notes: string }>;
}

export default function DailyLogPage() {
  const [date, setDate] = useState(todayISO());
  const [roles, setRoles] = useState<LabourRole[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phaseId, setPhaseId] = useState<number | null>(null);
  const [workSummary, setWorkSummary] = useState("");
  const [workAreas, setWorkAreas] = useState("");
  const [weather, setWeather] = useState("");
  const [issuesBlockers, setIssuesBlockers] = useState("");
  const [labourEntries, setLabourEntries] = useState<LabourEntry[]>([]);
  const [usageEntries, setUsageEntries] = useState<MaterialUsageEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<DailyLogRecord[]>([]);
  const [page, setPage] = useState(1);

  const loadRefs = useCallback(async () => {
    const [rolesRes, matsRes, phasesRes] = await Promise.all([
      fetch("/api/labour-roles").then(r => r.json()),
      fetch("/api/materials").then(r => r.json()),
      fetch("/api/phases").then(r => r.json()),
    ]);
    setRoles(rolesRes.filter((r: LabourRole) => r.isActive));
    setMaterials(matsRes);
    setPhases(phasesRes);
  }, []);

  const loadLogs = useCallback(async (p: number) => {
    const res = await fetch(`/api/daily-logs?page=${p}&limit=15`).then(r => r.json());
    setLogs(res.logs);
  }, []);

  useEffect(() => {
    loadRefs();
    loadLogs(page);
  }, [loadRefs, loadLogs, page]);

  // When roles load, initialize labourEntries
  useEffect(() => {
    if (roles.length > 0 && labourEntries.length === 0) {
      setLabourEntries(roles.map(r => ({
        labourRoleId: r.id,
        roleNameSnapshot: r.name,
        workerCount: 0,
        shiftMultiplier: 1,
        dailyRate: r.defaultDailyRate,
        extraAllowance: 0,
        paymentStatus: "Pending",
        notes: "",
      })));
    }
  }, [roles, labourEntries.length]);

  const updateEntry = (idx: number, field: keyof LabourEntry, value: number | string) => {
    setLabourEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const addUsageEntry = () => {
    if (materials.length > 0) {
      setUsageEntries(prev => [...prev, { materialId: materials[0].id, quantity: 0, notes: "" }]);
    }
  };

  const removeUsageEntry = (idx: number) => {
    setUsageEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate: date, phaseId, workSummary, workAreas, weather, issuesBlockers,
          labourEntries, materialUsages: usageEntries,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadLogs(page);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this log?")) return;
    await fetch(`/api/daily-logs/${id}`, { method: "DELETE" });
    loadLogs(page);
  };

  const totalWorkers = labourEntries.reduce((s, e) => s + e.workerCount, 0);
  const totalCost = labourEntries.reduce((s, e) => s + e.workerCount * e.shiftMultiplier * e.dailyRate + e.extraAllowance, 0);

  const changeDate = (delta: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
    setLabourEntries([]);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Daily Work Log</h1>

        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-lg border border-stone-300 hover:bg-stone-100">
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setLabourEntries([]); }}
            className="border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
          />
          <button onClick={() => changeDate(1)} className="p-2 rounded-lg border border-stone-300 hover:bg-stone-100">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { setDate(todayISO()); setLabourEntries([]); }}
            className="text-sm text-amber-600 hover:underline">Today
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Details */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 space-y-4">
              <h2 className="font-semibold text-stone-800 dark:text-stone-200">Work Details</h2>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Phase</label>
                <select
                  value={phaseId ?? ""}
                  onChange={e => setPhaseId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                >
                  <option value="">— Select Phase —</option>
                  {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Work Summary</label>
                <textarea
                  value={workSummary}
                  onChange={e => setWorkSummary(e.target.value)}
                  rows={3}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  placeholder="What work was done today..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase">Work Areas</label>
                  <input
                    type="text"
                    value={workAreas}
                    onChange={e => setWorkAreas(e.target.value)}
                    className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                    placeholder="e.g. Column A, B"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase">Weather</label>
                  <input
                    type="text"
                    value={weather}
                    onChange={e => setWeather(e.target.value)}
                    className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                    placeholder="Sunny, Rainy..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Issues / Blockers</label>
                <textarea
                  value={issuesBlockers}
                  onChange={e => setIssuesBlockers(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  placeholder="Any issues faced..."
                />
              </div>
            </div>

            {/* Material Usages */}
            <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-800 dark:text-stone-200">Material Usage</h2>
                <button onClick={addUsageEntry} className="flex items-center gap-1 text-sm text-amber-600 hover:underline">
                  <Plus size={14} /> Add
                </button>
              </div>
              {usageEntries.length === 0 ? (
                <p className="text-stone-400 text-sm">No material usages recorded.</p>
              ) : (
                <div className="space-y-2">
                  {usageEntries.map((u, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={u.materialId}
                        onChange={e => setUsageEntries(prev => prev.map((x, i) => i === idx ? { ...x, materialId: Number(e.target.value) } : x))}
                        className="flex-1 border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                      >
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                      </select>
                      <input
                        type="number"
                        value={u.quantity}
                        onChange={e => setUsageEntries(prev => prev.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))}
                        className="w-20 border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                        placeholder="Qty"
                        min="0"
                      />
                      <button onClick={() => removeUsageEntry(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Labour Entries */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800 dark:text-stone-200">Labour / Wages</h2>
              <div className="text-sm text-stone-500">
                <span className="font-medium text-stone-800 dark:text-stone-200">{totalWorkers} workers</span>
                {" · "}<span className="text-amber-600 font-medium">{formatINR(totalCost)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left py-1 pr-2 text-stone-500 font-medium">Role</th>
                    <th className="text-center py-1 px-1 text-stone-500 font-medium w-14">Count</th>
                    <th className="text-center py-1 px-1 text-stone-500 font-medium w-16">Rate</th>
                    <th className="text-center py-1 px-1 text-stone-500 font-medium w-14">Shift</th>
                    <th className="text-center py-1 px-1 text-stone-500 font-medium w-16">Extra</th>
                    <th className="text-right py-1 pl-1 text-stone-500 font-medium w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {labourEntries.map((e, idx) => {
                    const cost = e.workerCount * e.shiftMultiplier * e.dailyRate + e.extraAllowance;
                    return (
                      <tr key={e.labourRoleId} className="border-b border-stone-100 dark:border-stone-700/50">
                        <td className="py-1.5 pr-2 text-stone-700 dark:text-stone-300">{e.roleNameSnapshot}</td>
                        <td className="py-1.5 px-1">
                          <input
                            type="number"
                            min="0"
                            value={e.workerCount}
                            onChange={ev => updateEntry(idx, "workerCount", Number(ev.target.value))}
                            className="w-full border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 text-center bg-white dark:bg-stone-700 dark:text-stone-100"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <input
                            type="number"
                            min="0"
                            value={e.dailyRate}
                            onChange={ev => updateEntry(idx, "dailyRate", Number(ev.target.value))}
                            className="w-full border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 text-center bg-white dark:bg-stone-700 dark:text-stone-100"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <select
                            value={e.shiftMultiplier}
                            onChange={ev => updateEntry(idx, "shiftMultiplier", Number(ev.target.value))}
                            className="w-full border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 bg-white dark:bg-stone-700 dark:text-stone-100"
                          >
                            <option value={0.5}>Half</option>
                            <option value={1}>Full</option>
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2x</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-1">
                          <input
                            type="number"
                            min="0"
                            value={e.extraAllowance}
                            onChange={ev => updateEntry(idx, "extraAllowance", Number(ev.target.value))}
                            className="w-full border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 text-center bg-white dark:bg-stone-700 dark:text-stone-100"
                          />
                        </td>
                        <td className="py-1.5 pl-1 text-right font-medium text-stone-800 dark:text-stone-200">
                          {e.workerCount > 0 ? formatINR(cost) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Log"}
          </button>
        </div>

        {/* Past Logs */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Past Logs</h2>
          {logs.length === 0 ? (
            <p className="text-stone-400 text-sm">No logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left py-2 px-3 text-stone-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-stone-500 font-medium">Summary</th>
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">Workers</th>
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">Labour Cost</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                      <td className="py-2 px-3 whitespace-nowrap">{formatDate(log.logDate)}</td>
                      <td className="py-2 px-3 text-stone-500 max-w-xs truncate">{log.workSummary || "—"}</td>
                      <td className="py-2 px-3 text-right">{log.totalWorkers}</td>
                      <td className="py-2 px-3 text-right">{formatINR(log.totalCost)}</td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-stone-500 hover:text-stone-700 disabled:opacity-40"
            >
              ← Newer
            </button>
            <span className="text-sm text-stone-400">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < 15}
              className="text-sm text-stone-500 hover:text-stone-700 disabled:opacity-40"
            >
              Older →
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
