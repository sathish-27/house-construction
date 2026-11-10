"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { Save } from "lucide-react";

interface Settings {
  id: number;
  projectName: string;
  location: string;
  totalBudget: number;
  startDate: string;
  targetEndDate: string;
}

interface LabourRole {
  id: number;
  name: string;
  defaultDailyRate: number;
  isActive: boolean;
  sortOrder: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [roles, setRoles] = useState<LabourRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rolesSaved, setRolesSaved] = useState(false);

  const loadData = useCallback(async () => {
    const [settingsRes, rolesRes] = await Promise.all([
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/labour-roles").then(r => r.json()),
    ]);
    setSettings(settingsRes);
    setRoles(rolesRes);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveRole = async (role: LabourRole) => {
    await fetch("/api/labour-roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: role.id, defaultDailyRate: role.defaultDailyRate }),
    });
    setRolesSaved(true);
    setTimeout(() => setRolesSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Settings</h1>

        {/* Project Settings */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 space-y-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200">Project Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 uppercase">Project Name</label>
              <input
                value={settings.projectName ?? ""}
                onChange={e => setSettings(s => ({ ...s, projectName: e.target.value }))}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase">Location</label>
              <input
                value={settings.location ?? ""}
                onChange={e => setSettings(s => ({ ...s, location: e.target.value }))}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                placeholder="City, State"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase">Total Budget (₹)</label>
              <input
                type="number"
                value={settings.totalBudget ?? 0}
                onChange={e => setSettings(s => ({ ...s, totalBudget: Number(e.target.value) }))}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase">Start Date</label>
              <input
                type="date"
                value={settings.startDate ?? ""}
                onChange={e => setSettings(s => ({ ...s, startDate: e.target.value }))}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase">Target End Date</label>
              <input
                type="date"
                value={settings.targetEndDate ?? ""}
                onChange={e => setSettings(s => ({ ...s, targetEndDate: e.target.value }))}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {/* Labour Rate Settings */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-stone-800 dark:text-stone-200">Labour Daily Rates</h2>
              <p className="text-xs text-stone-400 mt-0.5">Default rates used in daily work logs</p>
            </div>
            {rolesSaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          </div>
          <div className="space-y-3">
            {roles.map(role => (
              <div key={role.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <span className="text-sm text-stone-700 dark:text-stone-300">{role.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">₹</span>
                  <input
                    type="number"
                    value={role.defaultDailyRate}
                    onChange={e => setRoles(prev => prev.map(r => r.id === role.id ? { ...r, defaultDailyRate: Number(e.target.value) } : r))}
                    onBlur={() => handleSaveRole(role)}
                    className="w-24 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100 text-right"
                    min="0"
                  />
                  <span className="text-xs text-stone-400">/day</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">Rates save automatically when you click outside a field.</p>
        </div>

        {/* About */}
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">About</h2>
          <p className="text-sm text-stone-500">House Construction Tracker — a local-first, offline-capable web app for tracking your construction project expenses, materials, labour and progress.</p>
          <p className="text-xs text-stone-400 mt-2">Data is stored locally in SQLite. No cloud, no uploads.</p>
        </div>
      </div>
    </AppShell>
  );
}
