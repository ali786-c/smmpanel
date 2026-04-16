import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Settings, Save } from "lucide-react";

const SETTING_GROUPS = [
  {
    label: "General",
    keys: ["site_name", "site_url", "support_email", "currency"],
    labels: { site_name: "Site Name", site_url: "Site URL", support_email: "Support Email", currency: "Currency" },
  },
  {
    label: "Provider",
    keys: ["provider_api_key", "provider_api_url"],
    labels: { provider_api_key: "Provider API Key", provider_api_url: "Provider API URL" },
    sensitive: ["provider_api_key"],
  },
  {
    label: "Registration",
    keys: ["registration_enabled", "default_balance", "min_deposit"],
    labels: { registration_enabled: "Registration Enabled (true/false)", default_balance: "Default Signup Balance ($)", min_deposit: "Minimum Deposit ($)" },
  },
];

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/settings");
    if (res.ok) {
      const d = await res.json();
      const raw = d.settings ?? d ?? {};
      const flat: Record<string, string> = {};
      Object.entries(raw).forEach(([k, v]: [string, any]) => {
        flat[k] = typeof v === "object" ? (v?.value ?? "") : String(v ?? "");
      });
      setSettings(flat);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/admin/settings", { method: "POST", body: JSON.stringify({ settings }) });
    if (res.ok) { toast.success("Settings saved"); load(); }
    else { const e = await res.json(); toast.error(e.message ?? "Save failed"); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> System Settings</h2>
        <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground gap-2 font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </Button>
      </div>

      {SETTING_GROUPS.map(group => (
        <div key={group.label} className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-heading font-semibold">{group.label}</h3>
          {group.keys.map(key => (
            <div key={key}>
              <label className="text-xs text-muted-foreground block mb-1.5">{(group.labels as any)[key] ?? key}</label>
              <Input
                type={group.sensitive?.includes(key) ? "password" : "text"}
                value={settings[key] ?? ""}
                onChange={e => setSettings(s => ({...s, [key]: e.target.value}))}
                placeholder={`${(group.labels as any)[key] ?? key}…`}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      ))}
    </form>
  );
}
