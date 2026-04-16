import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { ShoppingCart, Search, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  platform: string;
  category: string;
  rate: number;
  min_order: number;
  max_order: number;
  health_score: number;
}

const platformFilters = ["All", "Instagram", "Facebook", "YouTube", "Twitter", "TikTok", "Telegram", "Discord", "Spotify", "LinkedIn", "Other"];

export default function Services() {
  const [search, setSearch] = useState("");
  const [activePlatform, setActivePlatform] = useState("All");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/services?per_page=500")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = d?.data ?? d?.services ?? d ?? [];
        setServices(Array.isArray(list) ? list : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) => {
    const matchesPlatform = activePlatform === "All" || s.platform === activePlatform;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search campaign services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50" />
        </div>
        <Link to="/dashboard/new-order">
          <Button className="gradient-primary text-primary-foreground font-semibold">
            <ShoppingCart className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {platformFilters.map((p) => (
          <button key={p} onClick={() => setActivePlatform(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activePlatform === p ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            {p}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <p className="text-sm">No services found matching your search.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-secondary/20">
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Rate/1K</th>
                  <th className="px-4 py-3 font-medium">Min</th>
                  <th className="px-4 py-3 font-medium">Max</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.platform}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                    <td className="px-4 py-3 text-primary font-semibold">${Number(s.rate).toFixed(4)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.min_order}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.max_order}</td>
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/new-order?service=${s.id}`}>
                        <Button size="sm" className="gradient-primary text-primary-foreground text-xs">Order</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
