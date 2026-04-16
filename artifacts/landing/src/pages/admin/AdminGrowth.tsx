import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Zap, RefreshCw, Clock, Play, TrendingUp, Gift, Bell, Users, Mail, Star } from "lucide-react";

const automations = [
  { key: "retention",   label: "Retention Emails",        description: "Send re-engagement emails to inactive users",      icon: Mail,     schedule: "Daily" },
  { key: "upsell",      label: "Upsell Campaigns",        description: "Suggest higher-value services to active users",     icon: TrendingUp, schedule: "Weekly" },
  { key: "referral",    label: "Referral Rewards",        description: "Process and reward referral commissions",           icon: Gift,     schedule: "Hourly" },
  { key: "review",      label: "Review Requests",         description: "Ask satisfied customers to leave reviews",          icon: Star,     schedule: "Daily" },
  { key: "welcome",     label: "Welcome Series",          description: "Onboard new users with tips and service picks",     icon: Users,    schedule: "On signup" },
  { key: "alert",       label: "Low Balance Alerts",      description: "Notify users when wallet balance is low",           icon: Bell,     schedule: "Daily" },
];

export default function AdminGrowth() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<any>(null);

  const runAction = async (key: string) => {
    setRunning(key);
    const res = await apiFetch("/admin/growth/run", { method: "POST", body: JSON.stringify({ action: key }) });
    if (res.ok) { const d = await res.json(); toast.success(`${key} ran successfully`); setResults(r => ({...r, [key]: d})); }
    else toast.error(`${key} failed`);
    setRunning(null);
  };

  const runAll = async () => {
    setRunning("all");
    const res = await apiFetch("/admin/growth/run", { method: "POST", body: JSON.stringify({ action: "all" }) });
    if (res.ok) { const d = await res.json(); toast.success("All automations triggered"); setResults(d); }
    else toast.error("Failed to run all");
    setRunning(null);
  };

  const loadStats = async () => {
    const res = await apiFetch("/admin/growth/stats");
    if (res.ok) { setStats(await res.json()); }
    else toast.error("Could not load stats");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Growth Engine</h2>
            <p className="text-sm text-muted-foreground mt-1">Automated growth systems — retention, acquisition & engagement</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadStats} variant="outline" size="sm" className="gap-2">
              <TrendingUp className="w-4 h-4" /> Load Stats
            </Button>
            <Button onClick={runAll} disabled={running !== null} className="gradient-primary text-primary-foreground font-bold gap-2">
              {running === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run All
            </Button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-3 text-sm">Growth Stats</h3>
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}

      <div className="grid gap-4">
        {automations.map(auto => (
          <div key={auto.key} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <auto.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold">{auto.label}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{auto.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{auto.schedule}</Badge>
                    <Badge className="bg-primary/20 text-primary border-0 text-xs">Active</Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => runAction(auto.key)} disabled={running !== null} className="gap-2 flex-shrink-0">
                {running === auto.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Run
              </Button>
            </div>
            {results[auto.key] && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-xl text-xs font-mono">
                <pre className="whitespace-pre-wrap text-muted-foreground">{JSON.stringify(results[auto.key], null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
