import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Download, DollarSign, TrendingUp, ShoppingCart, Wallet, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function AdminRevenueExport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalProfit: 0, totalDeposits: 0, totalRefunds: 0,
    orderCount: 0, userCount: 0, dailyData: [] as any[],
  });

  useEffect(() => {
    const fetch = async () => {
      const [ordersRes, txRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("cost, profit, created_at, status"),
        supabase.from("wallet_transactions").select("amount, type, created_at"),
        supabase.from("profiles").select("id"),
      ]);

      const orders = ordersRes.data || [];
      const transactions = txRes.data || [];

      const totalRevenue = orders.reduce((s, o: any) => s + Number(o.cost || 0), 0);
      const totalProfit = orders.reduce((s, o: any) => s + Number(o.profit || 0), 0);
      const totalDeposits = transactions.filter((t: any) => t.type === "deposit").reduce((s, t: any) => s + Number(t.amount || 0), 0);
      const totalRefunds = transactions.filter((t: any) => t.type === "refund").reduce((s, t: any) => s + Math.abs(Number(t.amount || 0)), 0);

      // Daily revenue last 30 days
      const dailyMap: Record<string, { revenue: number; profit: number }> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = { revenue: 0, profit: 0 };
      }
      orders.forEach((o: any) => {
        const day = o.created_at.slice(0, 10);
        if (dailyMap[day]) {
          dailyMap[day].revenue += Number(o.cost || 0);
          dailyMap[day].profit += Number(o.profit || 0);
        }
      });

      setStats({
        totalRevenue, totalProfit, totalDeposits, totalRefunds,
        orderCount: orders.length,
        userCount: (profilesRes.data || []).length,
        dailyData: Object.entries(dailyMap).map(([date, v]) => ({ date: date.slice(5), revenue: +v.revenue.toFixed(2), profit: +v.profit.toFixed(2) })),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const exportCSV = async () => {
    const { data: orders } = await supabase.from("orders").select("id, user_id, cost, profit, provider_cost, quantity, status, created_at, services(name)");
    if (!orders) return;
    const headers = ["ID", "User", "Service", "Cost", "Profit", "Provider Cost", "Quantity", "Status", "Date"];
    const rows = orders.map((o: any) => [o.id, o.user_id, o.services?.name || "", o.cost, o.profit, o.provider_cost, o.quantity, o.status, o.created_at]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.map((c: any) => `"${c ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Revenue report exported");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Revenue Reports</h2>
        <Button onClick={exportCSV} className="gradient-primary text-primary-foreground font-bold gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign },
          { label: "Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp },
          { label: "Deposits", value: `$${stats.totalDeposits.toFixed(2)}`, icon: Wallet },
          { label: "Refunds", value: `$${stats.totalRefunds.toFixed(2)}`, icon: ShoppingCart },
          { label: "Orders", value: stats.orderCount, icon: ShoppingCart },
          { label: "Users", value: stats.userCount, icon: Users },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-heading font-bold text-lg">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Revenue & Profit (30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.dailyData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="hsl(var(--accent))" name="Profit" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
