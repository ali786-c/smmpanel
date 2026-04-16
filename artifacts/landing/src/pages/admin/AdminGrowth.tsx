import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Zap, RefreshCw, BookOpen, Megaphone, Users, Gift,
  TrendingUp, Clock, Play, ShoppingCart, Calendar, BarChart3, Code
} from "lucide-react";

interface AutomationAction {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  schedule: string;
}

const automations: AutomationAction[] = [
  { key: "re-engagement", label: "Re-engagement Notifications", description: "Send 10% off coupon to users inactive for 30+ days", icon: Users, schedule: "Daily at 9 AM UTC" },
  { key: "auto-promo", label: "Auto Promo Campaigns", description: "Weekend promos, auto-expire old coupons", icon: Megaphone, schedule: "Daily at 9 AM UTC" },
  { key: "blog-autopilot", label: "SEO Blog Autopilot", description: "Auto-generate & publish SEO blog posts (up to 2/day)", icon: BookOpen, schedule: "Daily at 6 AM UTC" },
  { key: "loyalty-check", label: "Loyalty Rewards", description: "Auto-credit bonus balance at spending milestones (DB trigger)", icon: Gift, schedule: "On every order (trigger)" },
  { key: "abandoned-recovery", label: "Abandoned Order Recovery", description: "Nudge users with balance but no recent orders with 5% coupon", icon: ShoppingCart, schedule: "Daily at 9 AM UTC" },
  { key: "milestone-celebration", label: "Milestone Celebrations", description: "Celebrate 10/50/100/500 orders with exclusive discount codes", icon: TrendingUp, schedule: "Daily at 9 AM UTC" },
  { key: "seasonal-campaigns", label: "Seasonal Auto-Campaigns", description: "Holiday-themed promos (Black Friday, Christmas, New Year, etc.)", icon: Calendar, schedule: "Daily at 9 AM UTC" },
  { key: "social-proof", label: "Social Proof Amplification", description: "Auto-publish platform stats & testimonials to blog", icon: BarChart3, schedule: "Daily at 9 AM UTC" },
  { key: "api-nurturing", label: "API User Nurturing", description: "Detect API key generated but no orders — send tutorial notification", icon: Code, schedule: "Daily at 9 AM UTC" },
];

export default function AdminGrowth() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});

  const runAction = async (action: string) => {
    setRunning(action);
    try {
      const { data, error } = await supabase.functions.invoke("growth-automation", { body: { action } });
      if (error) throw error;
      setResults((prev) => ({ ...prev, [action]: data?.results?.[action] || data?.results || data }));
      toast.success(`${action} completed`);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    setRunning("all");
    try {
      const { data, error } = await supabase.functions.invoke("growth-automation", { body: { action: "all" } });
      if (error) throw error;
      setResults(data?.results || {});
      toast.success("All growth automations completed");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-heading font-bold text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Growth Engine
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              9 automated growth systems — retention, acquisition & engagement
            </p>
          </div>
          <Button onClick={runAll} disabled={running !== null} className="gradient-primary text-primary-foreground font-bold">
            {running === "all" ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Running All...</> : <><Play className="w-4 h-4 mr-2" /> Run All Now</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {automations.map((auto) => (
          <div key={auto.key} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
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
              <Button variant="outline" size="sm" onClick={() => runAction(auto.key)} disabled={running !== null}>
                {running === auto.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-3 h-3 mr-1" /> Run</>}
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
