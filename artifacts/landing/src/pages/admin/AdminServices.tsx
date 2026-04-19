import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Plus, Edit2, Trash2, Layers, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const perPage = 30;

  const load = async (p = 1, q = "") => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), per_page: String(perPage) });
    if (q) params.set("search", q);
    const res = await apiFetch(`/admin/services?${params}`);
    if (res.ok) {
      const d = await res.json();
      setServices(d.data ?? d.services ?? []);
      setTotal(d.total ?? d.meta?.total ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(1, search); };

  const handleToggleActive = async (id: string, active: boolean) => {
    const res = await apiFetch(`/admin/services/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: !active }) });
    if (res.ok) { setServices(s => s.map(x => x.id === id ? { ...x, is_active: !active } : x)); }
    else toast.error("Update failed");
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const res = await apiFetch(`/admin/services/${editId}`, { method: "PATCH", body: JSON.stringify(editData) });
    if (res.ok) { toast.success("Service updated"); setEditId(null); load(page, search); }
    else toast.error("Update failed");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const res = await apiFetch(`/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(page, search); }
    else toast.error("Delete failed");
  };

  const pages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Services <span className="text-muted-foreground text-sm font-normal">({total})</span>
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services…" className="w-48 h-9 text-sm" />
          <Button type="submit" size="sm" variant="outline"><Search className="w-4 h-4" /></Button>
        </form>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID","Name","Category","Platform","Price","Min","Max","Active","Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No services — sync from provider</td></tr>
              ) : services.map(s => (
                <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/20">
                  {editId === s.id ? (
                    <>
                      <td className="px-3 py-2 text-xs font-mono">{s.provider_service_id ?? s.id}</td>
                      <td className="px-3 py-2"><Input value={editData.name ?? s.name} onChange={e => setEditData((d: any) => ({...d, name: e.target.value}))} className="h-7 text-xs w-48" /></td>
                      <td className="px-3 py-2 text-xs">{s.category}</td>
                      <td className="px-3 py-2 text-xs">{s.platform}</td>
                      <td className="px-3 py-2"><Input type="number" step="0.0001" value={editData.rate ?? s.rate} onChange={e => setEditData((d: any) => ({...d, rate: e.target.value}))} className="h-7 text-xs w-24" /></td>
                      <td className="px-3 py-2"><Input type="number" value={editData.min_order ?? s.min_order} onChange={e => setEditData((d: any) => ({...d, min_order: e.target.value}))} className="h-7 text-xs w-20" /></td>
                      <td className="px-3 py-2"><Input type="number" value={editData.max_order ?? s.max_order} onChange={e => setEditData((d: any) => ({...d, max_order: e.target.value}))} className="h-7 text-xs w-20" /></td>
                      <td className="px-3 py-2 text-xs">{s.is_active ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={handleSaveEdit}><Check className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 font-mono text-xs">{s.provider_service_id ?? String(s.id).slice(0,8)}</td>
                      <td className="px-3 py-2.5 text-xs truncate max-w-[150px]">{s.name}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.category}</td>
                      <td className="px-3 py-2.5 text-xs">{s.platform}</td>
                      <td className="px-3 py-2.5 text-xs font-bold text-primary">${parseFloat(s.rate || 0).toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-xs">{s.min_order}</td>
                      <td className="px-3 py-2.5 text-xs">{s.max_order}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => handleToggleActive(s.id, s.is_active)}
                          className={`w-8 h-4 rounded-full transition-colors ${s.is_active ? "bg-primary" : "bg-muted"} relative`}>
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow ${s.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditId(s.id); setEditData({}); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Page {page} of {pages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, search); }}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, search); }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
