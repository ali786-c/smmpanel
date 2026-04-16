import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, Activity, AlertTriangle, CheckCircle, XCircle, ToggleLeft, ToggleRight } from "lucide-react";

interface ServiceRow {
  id: string;
  name: string;
  platform: string;
  category: string;
  rate: number;
  min_order: number;
  max_order: number;
  health_score: number;
  is_active: boolean;
  external_service_id: number;
  refill: boolean;
  cancel: boolean;
}

export default function AdminServices() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState<"all" | "healthy" | "warning" | "critical">("all");

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .order("health_score", { ascending: true })
      .then(({ data }) => {
        setServices((data as ServiceRow[]) || []);
        setLoading(false);
      });
  }, []);

  const toggleService = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update service");
      return;
    }
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !currentActive } : s))
    );
    toast.success(currentActive ? "Service disabled" : "Service enabled");
  };

  const resetHealth = async (id: string) => {
    const { error } = await supabase
      .from("services")
      .update({ health_score: 100 })
      .eq("id", id);
    if (error) {
      toast.error("Failed to reset health");
      return;
    }
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, health_score: 100 } : s))
    );
    toast.success("Health score reset to 100");
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(q) || s.platform.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    if (!nameMatch) return false;
    if (filterHealth === "healthy") return s.health_score >= 80;
    if (filterHealth === "warning") return s.health_score >= 40 && s.health_score < 80;
    if (filterHealth === "critical") return s.health_score < 40;
    return true;
  });

  const healthyCnt = services.filter((s) => s.health_score >= 80).length;
  const warningCnt = services.filter((s) => s.health_score >= 40 && s.health_score < 80).length;
  const criticalCnt = services.filter((s) => s.health_score < 40).length;
  const _activeCnt = services.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-heading font-bold">{services.length}</p>
        </div>
        <button onClick={() => setFilterHealth("healthy")} className="glass rounded-2xl p-5 text-center hover:glow transition-all">
          <CheckCircle className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Healthy</p>
          <p className="text-xl font-heading font-bold text-primary">{healthyCnt}</p>
        </button>
        <button onClick={() => setFilterHealth("warning")} className="glass rounded-2xl p-5 text-center hover:glow transition-all">
          <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Warning</p>
          <p className="text-xl font-heading font-bold text-warning">{warningCnt}</p>
        </button>
        <button onClick={() => setFilterHealth("critical")} className="glass rounded-2xl p-5 text-center hover:glow transition-all">
          <XCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Critical</p>
          <p className="text-xl font-heading font-bold text-destructive">{criticalCnt}</p>
        </button>
      </div>

      {/* Filters + Bulk Actions */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="pl-10 bg-secondary/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "healthy", "warning", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterHealth(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterHealth === f
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={async () => {
              const ids = filtered.filter(s => !s.is_active).map(s => s.id);
              if (ids.length === 0) { toast.info("All filtered services already active"); return; }
              await Promise.all(ids.map(id => supabase.from("services").update({ is_active: true }).eq("id", id)));
              setServices(prev => prev.map(s => ids.includes(s.id) ? { ...s, is_active: true } : s));
              toast.success(`${ids.length} services enabled`);
            }}
          >
            <ToggleRight className="w-3.5 h-3.5 mr-1" /> Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-destructive/30 text-destructive"
            onClick={async () => {
              const ids = filtered.filter(s => s.is_active).map(s => s.id);
              if (ids.length === 0) { toast.info("All filtered services already disabled"); return; }
              await Promise.all(ids.map(id => supabase.from("services").update({ is_active: false }).eq("id", id)));
              setServices(prev => prev.map(s => ids.includes(s.id) ? { ...s, is_active: false } : s));
              toast.success(`${ids.length} services disabled`);
            }}
          >
            <ToggleLeft className="w-3.5 h-3.5 mr-1" /> Disable All
          </Button>
        </div>
      </div>

      {/* Services Table */}
      <div className="glass rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Service</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Platform</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Rate/1K</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Min/Max</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Health</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">No services found</td>
                </tr>
              ) : (
                filtered.map((service) => (
                  <tr key={service.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="py-3">
                      <p className="text-sm font-medium truncate max-w-[250px]">{service.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {service.external_service_id}</p>
                    </td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{service.platform}</span>
                    </td>
                    <td className="py-3 text-sm font-mono">${service.rate.toFixed(2)}</td>
                    <td className="py-3 text-xs text-muted-foreground">{service.min_order} - {service.max_order.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              service.health_score >= 80 ? "bg-primary" :
                              service.health_score >= 40 ? "bg-warning" : "bg-destructive"
                            }`}
                            style={{ width: `${service.health_score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          service.health_score >= 80 ? "text-primary" :
                          service.health_score >= 40 ? "text-warning" : "text-destructive"
                        }`}>{service.health_score}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        service.is_active ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                      }`}>
                        {service.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleService(service.id, service.is_active)}
                          className="text-xs"
                          title={service.is_active ? "Disable" : "Enable"}
                        >
                          {service.is_active ? (
                            <ToggleRight className="w-4 h-4 text-primary" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        {service.health_score < 100 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetHealth(service.id)}
                            className="text-xs"
                            title="Reset health"
                          >
                            <Activity className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
