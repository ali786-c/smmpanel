import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/finance/refunds");
    if (res.ok) { const d = await res.json(); setRefunds(d.data ?? d.refunds ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalRefunded = refunds.reduce((s, r) => s + parseFloat(r.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Refunds</h2>
        <div className="glass rounded-xl px-4 py-2 text-sm">
          <span className="text-muted-foreground">Total Refunded: </span>
          <span className="font-bold text-destructive">${totalRefunded.toFixed(2)}</span>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Order ID","User","Amount","Reason","Method","Status","Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No refunds yet</td></tr>
              ) : refunds.map(r => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-xs">{String(r.order_id ?? "—").slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs">{r.user_email ?? r.user?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-destructive">${parseFloat(r.amount ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[150px]">{r.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{r.payment_method ?? r.method ?? "Balance"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "completed" ? "bg-primary/20 text-primary" : r.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-secondary text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
