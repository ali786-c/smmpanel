import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(163,58%,50%)","hsl(210,100%,60%)","hsl(38,92%,50%)","hsl(0,84%,60%)","hsl(155,100%,75%)","hsl(270,60%,60%)"];

interface Order { cost: number; created_at: string; status: string; service?: { platform: string } | null; }

export default function SpendingAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/orders?per_page=500")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setOrders(d?.data ?? d?.orders ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((s, o) => s + Number(o.cost), 0);
    const now = new Date();
    const thisMonth = orders.filter(o => { const d = new Date(o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const monthlySpend = thisMonth.reduce((s, o) => s + Number(o.cost), 0);

    const platformMap: Record<string, number> = {};
    orders.forEach(o => { const p = (o.service as any)?.platform || "Other"; platformMap[p] = (platformMap[p] || 0) + Number(o.cost); });
    const platformData = Object.entries(platformMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })).sort((a, b) => b.value - a.value);

    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); dailyMap[d.toISOString().slice(0, 10)] = 0; }
    orders.forEach(o => { const day = o.created_at.slice(0, 10); if (dailyMap[day] !== undefined) dailyMap[day] += Number(o.cost); });
    const dailyData = Object.entries(dailyMap).map(([date, amount]) => ({ date: date.slice(5), amount: parseFloat(amount.toFixed(2)) }));

    return { totalSpent, monthlySpend, totalOrders: orders.length, platformData, dailyData };
  }, [orders]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Spent", value: `$${stats.totalSpent.toFixed(2)}`, icon: DollarSign },
          { label: "This Month", value: `$${stats.monthlySpend.toFixed(2)}`, icon: TrendingUp },
          { label: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><s.icon className="w-5 h-5 text-primary-foreground" /></div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="font-heading font-bold text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Daily Spend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.dailyData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} labelStyle={{ color: "hsl(var(--foreground))" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Spending by Platform</h3>
        {stats.platformData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {stats.platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full lg:w-64">
              {stats.platformData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span>{p.name}</span></div>
                  <span className="font-heading font-semibold">${p.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No order data yet</p>
        )}
      </div>
    </div>
  );
}
