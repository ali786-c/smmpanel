import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Percent, Save } from "lucide-react";

export default function AdminMarkupEditor() {
  const [markupPercent, setMarkupPercent] = useState("20");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    apiFetch("/admin/services?per_page=500")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const services = d?.data ?? d?.services ?? [];
        const unique = [...new Set(services.map((s: any) => s.platform).filter(Boolean))] as string[];
        setPlatforms(unique.sort());
      });

    apiFetch("/admin/settings/markup_percent")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.value !== null && d.value !== undefined) {
          setMarkupPercent(String(d.value));
        }
      });
  }, []);

  const handleApplyMarkup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const body: any = { markup_percent: parseFloat(markupPercent) };
    if (platform) body.platform = platform;
    const res = await apiFetch("/admin/services/markup", { method: "POST", body: JSON.stringify(body) });
    if (res.ok) { const d = await res.json(); toast.success(`Markup applied to ${d.updated_count ?? "all"} services`); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed to apply markup"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="glass rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Percent className="w-5 h-5 text-primary" /> Markup Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">Increase all service prices by a percentage above provider cost</p>
        </div>

        <form onSubmit={handleApplyMarkup} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Markup Percentage</label>
            <div className="relative">
              <Input type="number" min="0" max="1000" step="0.1" value={markupPercent}
                onChange={e => setMarkupPercent(e.target.value)} className="pr-8 text-sm" />
              <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">e.g. 20% means provider price × 1.20</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Platform (optional — leave blank for all)</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground">
              <option value="">All platforms</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground gap-2 font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Apply Markup
          </Button>
        </form>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-heading font-semibold text-sm mb-3">How it works</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Provider cost is stored as <code className="text-xs bg-secondary px-1 rounded">provider_cost</code></li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> New price = provider_cost × (1 + markup%/100)</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Profit = price − provider_cost per order</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Re-sync from provider resets prices — reapply markup after sync</li>
        </ul>
      </div>
    </div>
  );
}
