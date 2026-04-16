import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, Settings, Globe, DollarSign, Shield, Search as SearchIcon } from "lucide-react";

interface SettingRow {
  id: string;
  key: string;
  value: string;
}

const settingLabels: Record<string, { label: string; icon: any; description: string; toggle?: boolean }> = {
  site_name: { label: "Site Name", icon: Settings, description: "Display name shown in header and browser tab" },
  site_description: { label: "Site Description", icon: Globe, description: "Short description for branding" },
  default_currency: { label: "Currency", icon: DollarSign, description: "Default currency symbol (e.g. USD, EUR)" },
  global_markup_percent: { label: "Global Markup %", icon: DollarSign, description: "Default profit markup for new services" },
  maintenance_mode: { label: "Maintenance Mode", icon: Shield, description: "Set to 'true' to enable maintenance page", toggle: true },
  compliance_name_filter: { label: "Compliance Name Filter", icon: Shield, description: "Auto-sanitize service names during sync to be payment-processor compliant", toggle: true },
  meta_title: { label: "SEO Title", icon: SearchIcon, description: "Page title for search engines (<60 chars)" },
  meta_description: { label: "SEO Description", icon: SearchIcon, description: "Meta description for search engines (<160 chars)" },
  robots_index: { label: "Search Indexing", icon: Globe, description: "Allow search engines to index site (true/false)", toggle: true },
};

export default function AdminSystemSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("system_settings").select("*").order("key")
      .then(({ data }) => { setSettings((data as SettingRow[]) || []); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(edits).map(([key, value]) =>
      supabase.from("system_settings").update({ value, updated_by: user?.id }).eq("key", key)
    );
    await Promise.all(updates);
    setSettings((prev) => prev.map((s) => edits[s.key] !== undefined ? { ...s, value: edits[s.key] } : s));
    setEdits({});
    setSaving(false);
    toast.success("Settings saved");
  };

  const hasChanges = Object.keys(edits).length > 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> System Settings</h2>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-bold gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {settings.map((s) => {
          const meta = settingLabels[s.key] || { label: s.key, icon: Settings, description: "" };
          const Icon = meta.icon;
          return (
            <div key={s.id} className="glass rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mb-2">{meta.description}</p>
                  {meta.toggle ? (
                    <Switch
                      checked={(edits[s.key] ?? s.value) === "true"}
                      onCheckedChange={(checked) => setEdits({ ...edits, [s.key]: checked ? "true" : "false" })}
                    />
                  ) : (
                    <Input
                      value={edits[s.key] ?? s.value}
                      onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                      className="bg-secondary/50"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
