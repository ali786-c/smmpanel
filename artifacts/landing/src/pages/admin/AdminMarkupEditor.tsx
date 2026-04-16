import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save, Percent } from "lucide-react";

interface ServiceMarkup {
  id: string;
  name: string;
  platform: string;
  rate: number;
  is_active: boolean;
  external_service_id: number;
}

export default function AdminMarkupEditor() {
  const [services, setServices] = useState<ServiceMarkup[]>([]);
  const [markups, setMarkups] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [globalMarkup, setGlobalMarkup] = useState("40");

  useEffect(() => {
    const fetch = async () => {
      const [svcRes, settingsRes] = await Promise.all([
        supabase.from("services").select("id, name, platform, rate, is_active, external_service_id").order("display_order"),
        supabase.from("system_settings").select("value").eq("key", "global_markup_percent").single(),
      ]);
      setServices((svcRes.data as ServiceMarkup[]) || []);
      if (settingsRes.data) setGlobalMarkup(settingsRes.data.value);
      setLoading(false);
    };
    fetch();
  }, []);

  const applyGlobalMarkup = () => {
    const pct = parseFloat(globalMarkup) / 100;
    const newMarkups: Record<string, string> = {};
    services.forEach((s) => {
      newMarkups[s.id] = (s.rate * (1 + pct)).toFixed(4);
    });
    setMarkups(newMarkups);
    toast.info(`Applied ${globalMarkup}% markup to all services`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const updates = Object.entries(markups).map(([id, rate]) =>
      supabase.from("services").update({ rate: parseFloat(rate) }).eq("id", id)
    );
    await Promise.all(updates);
    await supabase.from("system_settings").update({ value: globalMarkup }).eq("key", "global_markup_percent");
    setServices((prev) => prev.map((s) => markups[s.id] ? { ...s, rate: parseFloat(markups[s.id]) } : s));
    setMarkups({});
    setSaving(false);
    toast.success("Rates updated");
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.platform.toLowerCase().includes(search.toLowerCase())
  );

  const hasChanges = Object.keys(markups).length > 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Percent className="w-5 h-5 text-primary" /> Service Markup Editor</h2>
        {hasChanges && (
          <Button onClick={handleSaveAll} disabled={saving} className="gradient-primary text-primary-foreground font-bold gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Changes
          </Button>
        )}
      </div>

      {/* Global Markup */}
      <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Global Markup Percentage</p>
          <Input type="number" value={globalMarkup} onChange={(e) => setGlobalMarkup(e.target.value)} className="bg-secondary/50 w-32" />
        </div>
        <Button onClick={applyGlobalMarkup} variant="outline" className="font-bold border-primary/30 hover:bg-primary/10">
          Apply {globalMarkup}% to All
        </Button>
      </div>

      <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary/50" />

      <div className="glass rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-3">ID</th><th className="pb-3">Service</th><th className="pb-3">Platform</th><th className="pb-3">Current Rate</th><th className="pb-3">New Rate</th><th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2 text-xs text-muted-foreground">{s.external_service_id}</td>
                  <td className="py-2 text-sm truncate max-w-[250px]">{s.name}</td>
                  <td className="py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s.platform}</span></td>
                  <td className="py-2 font-mono text-sm">${s.rate.toFixed(4)}</td>
                  <td className="py-2">
                    <Input
                      type="number"
                      step="0.0001"
                      value={markups[s.id] ?? ""}
                      onChange={(e) => setMarkups({ ...markups, [s.id]: e.target.value })}
                      placeholder={s.rate.toFixed(4)}
                      className="w-28 h-8 text-xs bg-secondary/50"
                    />
                  </td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                      {s.is_active ? "Active" : "Off"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
