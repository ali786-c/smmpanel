import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Download, DollarSign, TrendingUp, ShoppingCart, Users } from "lucide-react";

export default function AdminRevenueExport() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiFetch("/admin/finance").then(r => r.ok ? r.json() : null)
      .then(d => setStats(d?.overview ?? d ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiFetch("/admin/orders/revenue-export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `revenue-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
      } else {
        const d = await res.json();
        toast.error(d.message ?? "Export failed");
      }
    } catch { toast.error("Export failed"); }
    setExporting(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const s = stats ?? {};
  const statCards = [
    { label: "Total Revenue", value: `$${parseFloat(s.total_revenue ?? 0).toFixed(2)}`, icon: DollarSign },
    { label: "Total Profit", value: `$${parseFloat(s.total_profit ?? 0).toFixed(2)}`, icon: TrendingUp },
    { label: "Total Orders", value: (s.total_orders ?? 0).toLocaleString(), icon: ShoppingCart },
    { label: "Total Deposits", value: `$${parseFloat(s.total_deposits ?? 0).toFixed(2)}`, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Revenue Export</h2>
        <Button onClick={handleExport} disabled={exporting} className="gradient-primary text-primary-foreground gap-2 font-bold">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(st => (
          <div key={st.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{st.label}</span>
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <st.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-xl font-heading font-bold text-primary">{st.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-heading font-semibold mb-3">What's included in the export</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-primary">•</span> All orders with cost, profit, provider cost</li>
          <li className="flex items-start gap-2"><span className="text-primary">•</span> User info, service info, order status</li>
          <li className="flex items-start gap-2"><span className="text-primary">•</span> Payment transactions and refunds</li>
          <li className="flex items-start gap-2"><span className="text-primary">•</span> Date range: all time</li>
        </ul>
      </div>
    </div>
  );
}
