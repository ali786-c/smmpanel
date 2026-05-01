import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminFinance() {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/finance").then(r => r.ok ? r.json() : null),
      apiFetch("/admin/finance/transactions?per_page=50").then(r => r.ok ? r.json() : null),
    ]).then(([ov, tx]) => {
      setOverview(ov?.overview ?? ov ?? {});
      setTransactions(tx?.data ?? tx?.transactions ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const o = overview ?? {};
  const statCards = [
    { label: "Total Revenue", value: `$${parseFloat(o.total_revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { label: "Gross Profit", value: `$${parseFloat(o.gross_profit ?? o.total_profit ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Total Deposits", value: `$${parseFloat(o.total_deposits ?? 0).toFixed(2)}`, icon: ArrowDownLeft, color: "text-blue-400" },
    { label: "Total Refunds", value: `$${parseFloat(o.total_refunds ?? 0).toFixed(2)}`, icon: ArrowUpRight, color: "text-destructive" },
  ];

  const chartData = (o.daily_revenue ?? []).map((d: any) => ({ ...d, profit: d.profit ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Revenue & Profit Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(163,58%,50%)" radius={[2, 2, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="hsl(38,92%,50%)" radius={[2, 2, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                {["User","Type","Method","Amount","Status","Date"].map(h => <th key={h} className="pb-3 font-medium text-xs">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                  <td className="py-3 text-xs">{tx.user_email ?? tx.user?.email ?? "—"}</td>
                  <td className="py-3 capitalize text-xs">{tx.type}</td>
                  <td className="py-3 text-xs text-muted-foreground">{tx.payment_method ?? "—"}</td>
                  <td className={`py-3 font-bold text-sm ${tx.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                    {tx.amount >= 0 ? "+" : ""}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{tx.status}</span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
