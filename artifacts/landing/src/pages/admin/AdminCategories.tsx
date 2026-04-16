import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Layers } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/services?per_page=500")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const services = d?.data ?? d?.services ?? [];
        const cats: Record<string, { platform: string; count: number }> = {};
        services.forEach((s: any) => {
          const key = `${s.platform}:::${s.category}`;
          if (!cats[key]) cats[key] = { platform: s.platform, count: 0 };
          cats[key].count++;
        });
        setCategories(Object.entries(cats).map(([key, v]) => ({ key, ...v, category: key.split(":::")[1] })));
      }).finally(() => setLoading(false));
  }, []);

  const grouped = categories.reduce((acc: Record<string, any[]>, c) => {
    if (!acc[c.platform]) acc[c.platform] = [];
    acc[c.platform].push(c);
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Service Categories</h2>
      <p className="text-sm text-muted-foreground">Categories are derived from synced services. Sync from provider to update.</p>

      {Object.keys(grouped).length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No services synced yet</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([platform, cats]) => (
            <div key={platform} className="glass rounded-2xl p-5">
              <h3 className="font-heading font-semibold mb-3">{platform}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(cats as any[]).sort((a: any, b: any) => a.category.localeCompare(b.category)).map((c: any) => (
                  <div key={c.key} className="bg-secondary/30 rounded-xl px-3 py-2 text-xs">
                    <p className="font-medium text-foreground truncate">{c.category || "Uncategorized"}</p>
                    <p className="text-muted-foreground">{c.count} service{c.count !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
