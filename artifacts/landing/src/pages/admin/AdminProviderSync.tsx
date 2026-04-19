import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react";

export default function AdminProviderSync() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [resanitizing, setResanitizing] = useState(false);

  const fetchInfo = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/dashboard");
    if (res.ok) {
      const d = await res.json();
      const stats = d.stats;
      
      const platforms: Record<string, { count: number }> = {};
      if (stats.platform_breakdown) {
        Object.entries(stats.platform_breakdown).forEach(([p, count]) => {
          platforms[p] = { count: Number(count) };
        });
      }

      setInfo({
        total: stats.total_services,
        active: stats.active_services,
        inactive: stats.total_services - stats.active_services,
        platforms,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchInfo(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    const res = await apiFetch("/admin/services/sync", { method: "POST" });
    if (res.ok) { const d = await res.json(); toast.success(`Synced: ${d.synced ?? d.total ?? "done"} services`); fetchInfo(); }
    else { const e = await res.json(); toast.error(e.message ?? "Sync failed"); }
    setSyncing(false);
  };

  const handleResanitize = async () => {
    setResanitizing(true);
    const res = await apiFetch("/admin/services/resanitize", { method: "POST" });
    if (res.ok) { const d = await res.json(); toast.success(`Re-sanitized: ${d.updated ?? 0} services updated`); fetchInfo(); }
    else toast.error("Re-sanitize failed");
    setResanitizing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="glass rounded-2xl p-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Wifi className="w-5 h-5 text-primary" /> Provider Sync</h2>
          <p className="text-sm text-muted-foreground mt-1">Sync services from justpanel.com SMM API</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing || resanitizing} className="gradient-primary text-primary-foreground font-bold gap-2">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync Now
          </Button>
          <Button variant="outline" onClick={handleResanitize} disabled={syncing || resanitizing} className="gap-2 border-primary/30">
            {resanitizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Re-sanitize
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Services", value: info?.total ?? 0, icon: Wifi, color: "text-foreground" },
          { label: "Active", value: info?.active ?? 0, icon: CheckCircle, color: "text-primary" },
          { label: "Inactive", value: info?.inactive ?? 0, icon: WifiOff, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-heading font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {info?.platforms && Object.keys(info.platforms).length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" /> Platform Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(info.platforms).sort(([,a]: any, [,b]: any) => b.count - a.count).map(([platform, data]: [string, any]) => (
              <div key={platform} className="bg-secondary/30 rounded-xl p-3">
                <p className="text-xs font-medium">{platform}</p>
                <p className="text-lg font-bold">{data.count} <span className="text-xs text-muted-foreground font-normal">services</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
