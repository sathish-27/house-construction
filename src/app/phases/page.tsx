"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { formatINR, formatDate } from "@/lib/format";

interface Phase {
  id: number; name: string; status: string; sortOrder: number;
  allocatedBudget: number; actualSpend: number;
  startDate: string; endDate: string; notes: string;
}

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "On Hold"];

const statusColor: Record<string, string> = {
  "Not Started": "bg-stone-100 text-stone-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "Completed": "bg-green-100 text-green-700",
  "On Hold": "bg-yellow-100 text-yellow-700",
};

export default function PhasesPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Phase>>({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const data = await fetch("/api/phases").then(r => r.json());
    setPhases(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const startEdit = (phase: Phase) => {
    setEditing(phase.id);
    setEditData({
      status: phase.status,
      allocatedBudget: phase.allocatedBudget,
      startDate: phase.startDate || "",
      endDate: phase.endDate || "",
      notes: phase.notes || "",
    });
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    await fetch(`/api/phases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setSaving(false);
    setEditing(null);
    loadData();
  };

  const totalBudget = phases.reduce((s, p) => s + p.allocatedBudget, 0);
  const totalSpent = phases.reduce((s, p) => s + p.actualSpend, 0);

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Construction Phases</h1>
          <p className="text-stone-500 text-sm mt-1">
            Total Allocated: {formatINR(totalBudget)} · Total Spent: {formatINR(totalSpent)}
          </p>
        </div>

        <div className="space-y-4">
          {phases.map((phase, idx) => {
            const pct = phase.allocatedBudget > 0 ? Math.min(100, (phase.actualSpend / phase.allocatedBudget) * 100) : 0;
            const isEditing = editing === phase.id;

            return (
              <div key={phase.id} className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-stone-400 font-mono text-sm mt-0.5">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">{phase.name}</h3>
                        {!isEditing && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[phase.status] ?? "bg-stone-100 text-stone-600"}`}>
                            {phase.status}
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-stone-500">Status</label>
                            <select
                              value={editData.status}
                              onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                              className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                            >
                              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-stone-500">Allocated Budget (₹)</label>
                            <input
                              type="number"
                              value={editData.allocatedBudget}
                              onChange={e => setEditData(d => ({ ...d, allocatedBudget: Number(e.target.value) }))}
                              className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-stone-500">Start Date</label>
                            <input
                              type="date"
                              value={editData.startDate}
                              onChange={e => setEditData(d => ({ ...d, startDate: e.target.value }))}
                              className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-stone-500">End Date</label>
                            <input
                              type="date"
                              value={editData.endDate}
                              onChange={e => setEditData(d => ({ ...d, endDate: e.target.value }))}
                              className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-stone-500">Notes</label>
                            <input
                              value={editData.notes}
                              onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                              className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-stone-500 space-y-1">
                          <div className="flex gap-4 flex-wrap">
                            {phase.startDate && <span>Start: {formatDate(phase.startDate)}</span>}
                            {phase.endDate && <span>End: {formatDate(phase.endDate)}</span>}
                            {phase.notes && <span className="italic">{phase.notes}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-stone-800 dark:text-stone-200">{formatINR(phase.actualSpend)}</div>
                    {phase.allocatedBudget > 0 && (
                      <div className="text-xs text-stone-400">/ {formatINR(phase.allocatedBudget)}</div>
                    )}
                  </div>
                </div>

                {/* Budget Progress */}
                {phase.allocatedBudget > 0 && !isEditing && (
                  <div className="mt-3">
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{pct.toFixed(1)}% of budget used</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(phase.id)}
                        disabled={saving}
                        className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-300"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(phase)}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
