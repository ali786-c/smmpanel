import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, History, User, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;

  const load = async (p = 1) => {
    setLoading(true);
    const res = await apiFetch(`/admin/activity-log?page=${p}&per_page=${perPage}`);
    if (res.ok) { const d = await res.json(); setLogs(d.data ?? d.logs ?? []); setTotal(d.total ?? d.meta?.total ?? 0); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Activity Log <span className="text-muted-foreground text-sm font-normal">({total})</span></h2>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Actor","Action","Entity","Details","IP","Time"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No activity yet</td></tr>
              ) : logs.map((l, i) => (
                <tr key={l.id ?? i} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      {l.actor_role === "admin" ? <Shield className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="font-medium">{l.actor_email ?? l.user_email ?? "System"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-primary">{l.action ?? l.event}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.entity_type ?? l.model ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[200px]">{typeof l.details === "object" ? JSON.stringify(l.details).slice(0, 60) : (l.details ?? "—")}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{l.ip_address ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
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
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p); }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
