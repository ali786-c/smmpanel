import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalProfit: 0, totalDeposits: 0, totalRefunds: 0,
    walletBalances: 0, orderCount: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; revenue: number; profit: number }[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ordersRes, walletsRes, txRes, refundsRes] = await Promise.all([
      supabase.from("orders").select("cost, profit, created_at"),
      supabase.from("wallets").select("balance"),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("refund_log").select("amount"),
    ]);

    const orders = ordersRes.data || [];
    const wallets = walletsRes.data || [];
    const txs = txRes.data || [];
    const refunds = refundsRes.data || [];

    const totalRevenue = orders.reduce((s, o) => s + (o.cost || 0), 0);
    const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
    const totalDeposits = txs.filter((t) => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
    const totalRefunds = refunds.reduce((s, r) => s + r.amount, 0);
    const walletBalances = wallets.reduce((s, w) => s + w.balance, 0);

    setStats({ totalRevenue, totalProfit, totalDeposits, totalRefunds, walletBalances, orderCount: orders.length });
    setTransactions(txs);

    // Build 14-day chart
    const days: Record<string, { revenue: number; profit: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      days[d] = { revenue: 0, profit: 0 };
    }
    orders.forEach((o) => {
      const d = format(new Date(o.created_at), "MMM d");
      if (days[d]) {
        days[d].revenue += o.cost || 0;
        days[d].profit += o.profit || 0;
      }
    });
    setChartData(Object.entries(days).map(([date, v]) => ({ date, ...v })));
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Total Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp },
    { label: "Total Deposits", value: `$${stats.totalDeposits.toFixed(2)}`, icon: ArrowDownLeft },
    { label: "Total Refunds", value: `$${stats.totalRefunds.toFixed(2)}`, icon: ArrowUpRight },
    { label: "Wallet Balances", value: `$${stats.walletBalances.toFixed(2)}`, icon: DollarSign },
    { label: "Orders", value: stats.orderCount.toLocaleString(), icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
            <p className="text-xl font-heading font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Revenue & Profit (14 days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="profit" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 capitalize">{tx.type}</td>
                  <td className="py-3 text-muted-foreground">{tx.payment_method || "—"}</td>
                  <td className={`py-3 font-heading font-semibold ${tx.amount > 0 ? "text-primary" : "text-destructive"}`}>
                    {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{tx.status}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{format(new Date(tx.created_at), "MMM d, yyyy")}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
