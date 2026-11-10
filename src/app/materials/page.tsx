"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { formatINR, formatDate, todayISO } from "@/lib/format";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  lowStockThreshold: number;
  purchased: number;
  consumed: number;
  remaining: number;
  totalSpent: number;
  isLowStock: boolean;
}

interface Phase { id: number; name: string; }
interface Vendor { id: number; name: string; }

interface Purchase {
  purchase: {
    id: number; purchaseDate: string; materialId: number; quantity: number;
    unitPrice: number; totalAmount: number; paidAmount: number; paymentStatus: string;
    invoiceNumber: string; notes: string;
  };
  materialName: string;
  materialUnit: string;
  vendorName: string | null;
  phaseName: string | null;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tab, setTab] = useState<"stock" | "purchases" | "add-material" | "add-purchase">("stock");

  // Add material form
  const [matName, setMatName] = useState("");
  const [matCategory, setMatCategory] = useState("");
  const [matUnit, setMatUnit] = useState("nos");
  const [matThreshold, setMatThreshold] = useState(0);

  // Add purchase form
  const [pDate, setPDate] = useState(todayISO());
  const [pMaterialId, setPMaterialId] = useState<number>(0);
  const [pVendorId, setPVendorId] = useState<number | null>(null);
  const [pPhaseId, setPPhaseId] = useState<number | null>(null);
  const [pQty, setPQty] = useState(0);
  const [pUnitPrice, setPUnitPrice] = useState(0);
  const [pTransport, setPTransport] = useState(0);
  const [pGst, setPGst] = useState(0);
  const [pPaid, setPPaid] = useState(0);
  const [pStatus, setPStatus] = useState<"Paid" | "Partial" | "Pending">("Pending");
  const [pMode, setPMode] = useState("Cash");
  const [pInvoice, setPInvoice] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [matsRes, purchRes, phasesRes, vendorsRes] = await Promise.all([
      fetch("/api/materials").then(r => r.json()),
      fetch("/api/purchases").then(r => r.json()),
      fetch("/api/phases").then(r => r.json()),
      fetch("/api/vendors").then(r => r.json()),
    ]);
    setMaterials(matsRes);
    setPurchases(purchRes);
    setPhases(phasesRes);
    setVendors(vendorsRes);
    if (matsRes.length > 0 && pMaterialId === 0) setPMaterialId(matsRes[0].id);
  }, [pMaterialId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddMaterial = async () => {
    if (!matName.trim()) return;
    setSaving(true);
    await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: matName, category: matCategory, unit: matUnit, lowStockThreshold: matThreshold }),
    });
    setMatName(""); setMatCategory(""); setMatUnit("nos"); setMatThreshold(0);
    setSaving(false);
    loadData();
    setTab("stock");
  };

  const handleAddPurchase = async () => {
    if (!pMaterialId || pQty <= 0) return;
    setSaving(true);
    await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseDate: pDate, materialId: pMaterialId, vendorId: pVendorId, phaseId: pPhaseId,
        quantity: pQty, unitPrice: pUnitPrice, transportCost: pTransport, gstAmount: pGst,
        paidAmount: pPaid, paymentStatus: pStatus, paymentMode: pMode, invoiceNumber: pInvoice,
      }),
    });
    setSaving(false);
    loadData();
    setTab("purchases");
  };

  const handleDeletePurchase = async (id: number) => {
    if (!confirm("Delete this purchase?")) return;
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    loadData();
  };

  const totalPurchase = pQty * pUnitPrice + pTransport + pGst;

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Materials</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-stone-200 dark:border-stone-700">
          {(["stock", "purchases", "add-material", "add-purchase"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-amber-500 text-amber-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
            >
              {t === "stock" ? "Stock" : t === "purchases" ? "Purchases" : t === "add-material" ? "+ Material" : "+ Purchase"}
            </button>
          ))}
        </div>

        {/* Stock Tab */}
        {tab === "stock" && (
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Material</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-stone-500">Purchased</th>
                  <th className="text-right py-3 px-4 font-medium text-stone-500">Consumed</th>
                  <th className="text-right py-3 px-4 font-medium text-stone-500">Remaining</th>
                  <th className="text-right py-3 px-4 font-medium text-stone-500">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className={`border-t border-stone-100 dark:border-stone-700/50 ${m.isLowStock ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {m.isLowStock && <AlertTriangle size={14} className="text-red-500" />}
                        <span className="font-medium text-stone-800 dark:text-stone-200">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-500">{m.category || "—"}</td>
                    <td className="py-3 px-4 text-right">{m.purchased} {m.unit}</td>
                    <td className="py-3 px-4 text-right">{m.consumed} {m.unit}</td>
                    <td className={`py-3 px-4 text-right font-medium ${m.isLowStock ? "text-red-600" : "text-green-600"}`}>
                      {m.remaining} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-right">{formatINR(m.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Purchases Tab */}
        {tab === "purchases" && (
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 dark:bg-stone-700/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-stone-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-500">Material</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-500">Vendor</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-500">Qty</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-500">Total</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-500">Status</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(({ purchase: p, materialName, materialUnit, vendorName, phaseName }) => (
                    <tr key={p.id} className="border-t border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                      <td className="py-3 px-4">
                        <div>{materialName}</div>
                        {phaseName && <div className="text-xs text-stone-400">{phaseName}</div>}
                      </td>
                      <td className="py-3 px-4 text-stone-500">{vendorName || "—"}</td>
                      <td className="py-3 px-4 text-right">{p.quantity} {materialUnit}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatINR(p.totalAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.paymentStatus === "Paid" ? "bg-green-100 text-green-700" :
                          p.paymentStatus === "Partial" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{p.paymentStatus}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDeletePurchase(p.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Material Tab */}
        {tab === "add-material" && (
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 max-w-lg space-y-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200">Add New Material</h2>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase">Name *</label>
              <input value={matName} onChange={e => setMatName(e.target.value)}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                placeholder="e.g. Cement OPC 53" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Category</label>
                <input value={matCategory} onChange={e => setMatCategory(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  placeholder="e.g. Binding" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Unit</label>
                <input value={matUnit} onChange={e => setMatUnit(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  placeholder="e.g. bags, kg, nos" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase">Low Stock Alert Threshold</label>
              <input type="number" value={matThreshold} onChange={e => setMatThreshold(Number(e.target.value))}
                className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                min="0" />
            </div>
            <button onClick={handleAddMaterial} disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
              <Plus size={16} /> Add Material
            </button>
          </div>
        )}

        {/* Add Purchase Tab */}
        {tab === "add-purchase" && (
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 max-w-2xl space-y-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200">Record Purchase</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Date *</label>
                <input type="date" value={pDate} onChange={e => setPDate(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Material *</label>
                <select value={pMaterialId} onChange={e => setPMaterialId(Number(e.target.value))}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Vendor</label>
                <select value={pVendorId ?? ""} onChange={e => setPVendorId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option value="">— None —</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Phase</label>
                <select value={pPhaseId ?? ""} onChange={e => setPPhaseId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option value="">— None —</option>
                  {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Quantity *</label>
                <input type="number" value={pQty} onChange={e => setPQty(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Unit Price (₹)</label>
                <input type="number" value={pUnitPrice} onChange={e => setPUnitPrice(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Transport (₹)</label>
                <input type="number" value={pTransport} onChange={e => setPTransport(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">GST (₹)</label>
                <input type="number" value={pGst} onChange={e => setPGst(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Paid Amount (₹)</label>
                <input type="number" value={pPaid} onChange={e => setPPaid(Number(e.target.value))} min="0"
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Payment Status</label>
                <select value={pStatus} onChange={e => setPStatus(e.target.value as "Paid" | "Partial" | "Pending")}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option>Pending</option>
                  <option>Partial</option>
                  <option>Paid</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Payment Mode</label>
                <select value={pMode} onChange={e => setPMode(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100">
                  <option>Cash</option><option>UPI</option><option>NEFT</option><option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase">Invoice No</label>
                <input value={pInvoice} onChange={e => setPInvoice(e.target.value)}
                  className="mt-1 w-full border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100" />
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-stone-600">Total Amount:</span>
              <span className="font-bold text-amber-700 text-lg">{formatINR(totalPurchase)}</span>
            </div>
            <button onClick={handleAddPurchase} disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
              <Plus size={16} /> Record Purchase
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
