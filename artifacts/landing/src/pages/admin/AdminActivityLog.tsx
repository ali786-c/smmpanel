import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, User, Shield } from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: any;
  created_at: string;
}

const actionColors: Record<string, string> = {
  wallet_credit: "text-primary",
  wallet_debit: "text-destructive",
  role_change: "text-warning",
  service_toggle: "text-info",
  coupon_create: "text-primary",
};

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setLogs((data as LogEntry[]) || []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Activity Log</h2>

      <div className="glass rounded-2xl p-6">
        {logs.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No activity recorded yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {log.target_type === "user" ? <User className="w-4 h-4 text-primary" /> : <Shield className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className={`font-medium ${actionColors[log.action] || "text-foreground"}`}>
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </span>
                    {log.target_id && <span className="text-muted-foreground"> → {log.target_id.slice(0, 12)}...</span>}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(log.created_at), "PPpp")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
