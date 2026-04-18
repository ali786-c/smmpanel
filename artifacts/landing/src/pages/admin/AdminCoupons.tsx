import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag, Check, X } from "lucide-react";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_uses: "",
    expires_at: ""
  });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/coupons");
    if (res.ok) { const d = await res.json(); setCoupons(d?.data ?? d?.coupons ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/admin/coupons", {
      method: "POST",
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    });
    if (res.ok) {
      toast.success("Coupon created");
      setCreating(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", expires_at: "" });
      load();
    } else {
      const e = await res.json();
      toast.error(e.message ?? "Failed to create coupon");
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const res = await apiFetch(`/admin/coupons/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: !active }) });
    if (res.ok) { setCoupons(c => c.map(x => x.id === id ? { ...x, is_active: !active } : x)); }
    else toast.error("Update failed");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    const res = await apiFetch(`/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(); }
    else toast.error("Delete failed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Coupons</h2>
        <Button onClick={() => setCreating(true)} className="gradient-primary text-primary-foreground gap-2 h-9"><Plus className="w-4 h-4" /> New Coupon</Button>
      </div>

      {creating && (
        <div className="glass rounded-2xl p-5">
          <form onSubmit={handleCreate} className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold ml-1">Code</label>
              <Input required value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} placeholder="SUMMER20" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold ml-1">Type</label>
              <select 
                value={form.discount_type} 
                onChange={e => setForm(f => ({...f, discount_type: e.target.value}))}
                className="w-full h-9 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold ml-1">Value</label>
              <Input required type="number" step="0.01" value={form.discount_value} onChange={e => setForm(f => ({...f, discount_value: e.target.value}))} placeholder={form.discount_type === 'percentage' ? "10" : "5.00"} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold ml-1">Min Order</label>
              <Input type="number" step="0.01" value={form.min_order_amount} onChange={e => setForm(f => ({...f, min_order_amount: e.target.value}))} placeholder="0.00" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold ml-1">Max Uses</label>
              <Input type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({...f, max_uses: e.target.value}))} placeholder="Unlimted" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold ml-1">Expiry</label>
              <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} className="h-9 text-sm" />
            </div>
            <div className="col-span-2 lg:col-span-6 flex gap-2 pt-2">
              <Button type="submit" className="gradient-primary text-primary-foreground gap-2"><Check className="w-4 h-4" /> Create Coupon</Button>
              <Button type="button" variant="outline" onClick={() => setCreating(false)} className="gap-2"><X className="w-4 h-4" /> Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Code","Discount","Min Order","Used","Max Uses","Expires","Active","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No coupons yet</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-sm text-primary">{c.code}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {c.discount_type === 'percentage' ? `${parseFloat(c.discount_value)}%` : `$${parseFloat(c.discount_value).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">${parseFloat(c.min_order_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{c.used_count ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.max_uses ?? "∞"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : <span className="opacity-30">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c.id, c.is_active)}
                      className={`w-8 h-4 rounded-full transition-colors ${c.is_active ? "bg-primary" : "bg-muted"} relative active:scale-95 transition-all`}>
                      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow ${c.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
