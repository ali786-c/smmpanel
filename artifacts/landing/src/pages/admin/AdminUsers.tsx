import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, Users, Ban, DollarSign, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const perPage = 25;

  const load = async (p = 1, q = "") => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), per_page: String(perPage) });
    if (q) params.set("search", q);
    const res = await apiFetch(`/admin/users?${params}`);
    if (res.ok) {
      const d = await res.json();
      setUsers(d.data ?? d.users ?? []);
      setTotal(d.total ?? d.meta?.total ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(1, search); };

  const handleBan = async (id: string, banned: boolean) => {
    const res = await apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ is_banned: !banned }) });
    if (res.ok) { toast.success(!banned ? "User banned" : "Unbanned"); setUsers(u => u.map(x => x.id === id ? { ...x, is_banned: !banned } : x)); }
    else toast.error("Failed");
  };

  const handleAdjust = async () => {
    if (!adjustId || !adjustAmount) return;
    const res = await apiFetch(`/admin/users/${adjustId}/adjust-balance`, {
      method: "POST", body: JSON.stringify({ amount: parseFloat(adjustAmount), reason: adjustNote || "Admin adjustment" }),
    });
    if (res.ok) { toast.success("Balance adjusted"); setAdjustId(null); setAdjustAmount(""); setAdjustNote(""); load(page, search); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed"); }
  };

  const pages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Users <span className="text-muted-foreground text-sm font-normal">({total})</span>
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name…" className="w-56 h-9 text-sm" />
          <Button type="submit" size="sm" variant="outline"><Search className="w-4 h-4" /></Button>
        </form>
      </div>

      {adjustId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-3">
            <h3 className="font-heading font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Adjust Balance</h3>
            <Input type="number" step="0.01" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="Amount (use negative to deduct)" />
            <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Note (optional)" />
            <div className="flex gap-2">
              <Button onClick={handleAdjust} className="flex-1 gradient-primary text-primary-foreground">Apply</Button>
              <Button variant="outline" onClick={() => setAdjustId(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Email","Name","Balance","Orders","Role","Joined","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={`border-b border-border/30 hover:bg-secondary/20 ${u.is_banned ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-xs font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.profile?.display_name ?? u.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-primary">${parseFloat(String(u.wallet?.balance ?? u.balance ?? 0)).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs">{u.order_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.roles?.includes("admin") ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {u.roles?.includes("admin") ? "Admin" : "User"}
                    </span>
                    {u.is_banned && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">Banned</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/users/${u.id}`}><Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View"><Eye className="w-3.5 h-3.5" /></Button></Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Adjust balance" onClick={() => setAdjustId(u.id)}><DollarSign className="w-3.5 h-3.5 text-primary" /></Button>
                      <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${u.is_banned ? "text-primary" : "text-destructive"}`}
                        title={u.is_banned ? "Unban" : "Ban"} onClick={() => handleBan(u.id, u.is_banned ?? false)}>
                        <Ban className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
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
