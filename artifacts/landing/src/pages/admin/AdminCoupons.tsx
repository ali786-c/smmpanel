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
  const [form, setForm] = useState({ code: "", discount_percent: "", max_uses: "", expires_at: "" });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/coupons");
    if (res.ok) { const d = await res.json(); setCoupons(d.data ?? d.coupons ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/admin/coupons", {
      method: "POST",
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        discount_percent: parseFloat(form.discount_percent),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    });
    if (res.ok) { toast.success("Coupon created"); setCreating(false); setForm({ code: "", discount_percent: "", max_uses: "", expires_at: "" }); load(); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed"); }
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
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input required value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} placeholder="CODE (uppercase)" className="h-9 text-sm" />
            <Input required type="number" min="1" max="100" step="0.01" value={form.discount_percent} onChange={e => setForm(f => ({...f, discount_percent: e.target.value}))} placeholder="Discount %" className="h-9 text-sm" />
            <Input type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({...f, max_uses: e.target.value}))} placeholder="Max uses (blank = unlimited)" className="h-9 text-sm" />
            <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} className="h-9 text-sm" />
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <Button type="submit" className="gradient-primary text-primary-foreground gap-2"><Check className="w-4 h-4" /> Create</Button>
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
                {["Code","Discount","Used","Max Uses","Expires","Active","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No coupons yet</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono font-bold text-sm text-primary">{c.code}</td>
                  <td className="px-4 py-3 text-sm">{c.discount_percent}%</td>
                  <td className="px-4 py-3 text-sm">{c.used_count ?? c.times_used ?? 0}</td>
                  <td className="px-4 py-3 text-sm">{c.max_uses ?? "∞"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c.id, c.is_active)}
                      className={`w-8 h-4 rounded-full transition-colors ${c.is_active ? "bg-primary" : "bg-muted"} relative`}>
                      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow ${c.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
