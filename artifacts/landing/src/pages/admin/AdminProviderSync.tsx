import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, XCircle, Wifi, WifiOff, Clock, Shield } from "lucide-react";
import { format } from "date-fns";

interface SyncInfo {
  total: number;
  active: number;
  inactive: number;
  healthy: number;
  warning: number;
  critical: number;
  lastUpdated: string | null;
  platforms: Record<string, { count: number; avgHealth: number }>;
}

export default function AdminProviderSync() {
  const [info, setInfo] = useState<SyncInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [resanitizing, setResanitizing] = useState(false);

  const fetchInfo = async () => {
    const { data } = await supabase.from("services").select("*");
    const services = data || [];
    const platforms: Record<string, { count: number; totalHealth: number }> = {};
    services.forEach((s: any) => {
      if (!platforms[s.platform]) platforms[s.platform] = { count: 0, totalHealth: 0 };
      platforms[s.platform].count++;
      platforms[s.platform].totalHealth += s.health_score;
    });
    const platResult: Record<string, { count: number; avgHealth: number }> = {};
    Object.entries(platforms).forEach(([k, v]) => {
      platResult[k] = { count: v.count, avgHealth: Math.round(v.totalHealth / v.count) };
    });
    const latest = services.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    setInfo({
      total: services.length,
      active: services.filter((s: any) => s.is_active).length,
      inactive: services.filter((s: any) => !s.is_active).length,
      healthy: services.filter((s: any) => s.health_score >= 80).length,
      warning: services.filter((s: any) => s.health_score >= 40 && s.health_score < 80).length,
      critical: services.filter((s: any) => s.health_score < 40).length,
      lastUpdated: latest?.updated_at || null,
      platforms: platResult,
    });
    setLoading(false);
  };

  useEffect(() => { fetchInfo(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-services");
      if (error) throw error;
      toast.success("Sync completed");
      await fetchInfo();
    } catch {
      toast.error("Sync failed — check provider credentials");
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !info) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Wifi className="w-5 h-5 text-primary" /> Provider Sync Status</h2>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing || resanitizing} className="gradient-primary text-primary-foreground font-bold gap-2">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync Now
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              setResanitizing(true);
              try {
                const { data, error } = await supabase.functions.invoke("resanitize-services");
                if (error) throw error;
                toast.success(`Compliance filter applied: ${data?.updated || 0} services updated out of ${data?.total || 0}`);
                await fetchInfo();
              } catch {
                toast.error("Re-sanitize failed");
              } finally {
                setResanitizing(false);
              }
            }}
            disabled={syncing || resanitizing}
            className="gap-2 border-primary/30"
          >
            {resanitizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Re-Sanitize Names
          </Button>
        </div>
      </div>

      {/* Last Sync */}
      <div className="glass rounded-2xl p-5 flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Last Sync</p>
          <p className="text-sm font-medium">{info.lastUpdated ? format(new Date(info.lastUpdated), "PPpp") : "Never"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: info.total, icon: Wifi, color: "text-foreground" },
          { label: "Active", value: info.active, icon: CheckCircle, color: "text-primary" },
          { label: "Inactive", value: info.inactive, icon: WifiOff, color: "text-muted-foreground" },
          { label: "Healthy", value: info.healthy, icon: CheckCircle, color: "text-primary" },
          { label: "Warning", value: info.warning, icon: AlertTriangle, color: "text-warning" },
          { label: "Critical", value: info.critical, icon: XCircle, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`font-heading font-bold text-lg ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Platform Breakdown */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Platform Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(info.platforms).sort((a, b) => b[1].count - a[1].count).map(([platform, data]) => (
            <div key={platform} className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{platform}</p>
                <p className="text-xs text-muted-foreground">{data.count} services</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${data.avgHealth >= 80 ? "bg-primary" : data.avgHealth >= 40 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${data.avgHealth}%` }} />
                </div>
                <span className={`text-xs font-bold ${data.avgHealth >= 80 ? "text-primary" : data.avgHealth >= 40 ? "text-warning" : "text-destructive"}`}>
                  {data.avgHealth}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
