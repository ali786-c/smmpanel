import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, DollarSign } from "lucide-react";

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/affiliates").then(r => r.ok ? r.json() : null),
      apiFetch("/admin/affiliates/stats").then(r => r.ok ? r.json() : null),
    ]).then(([aff, st]) => {
      setAffiliates(aff?.data ?? aff?.affiliates ?? []);
      setStats(st ?? {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Affiliates</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Affiliates", value: stats.total_affiliates ?? affiliates.length },
            { label: "Total Referrals", value: stats.total_referrals ?? 0 },
            { label: "Total Commissions", value: `$${parseFloat(stats.total_commissions ?? 0).toFixed(2)}` },
            { label: "Pending Payouts", value: `$${parseFloat(stats.pending_payouts ?? 0).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-heading font-bold text-primary">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["User","Code","Referrals","Earned","Paid","Pending","Joined"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affiliates.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No affiliates yet</td></tr>
              ) : affiliates.map(a => (
                <tr key={a.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-xs font-medium">{a.user_email ?? a.email ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{a.code ?? a.referral_code}</td>
                  <td className="px-4 py-3 text-xs">{a.referral_count ?? a.referrals ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-primary font-bold">${parseFloat(a.total_earned ?? a.commission_earned ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs">${parseFloat(a.total_paid ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-yellow-400">${parseFloat(a.pending_payout ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
