import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const platformFilters = ["All", "Instagram", "TikTok", "YouTube", "Twitter", "Facebook", "Telegram"];

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

export default function Services() {
  const [search, setSearch] = useState("");
  const [activePlatform, setActivePlatform] = useState("All");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("services").select("*").eq("is_active", true).order("display_order")
      .then(({ data }) => { setServices((data as Service[]) || []); setLoading(false); });
  }, []);

  const filtered = services.filter((s) => {
    const matchesPlatform = activePlatform === "All" || s.platform === activePlatform;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search campaign services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Link to="/dashboard/new-order">
          <Button className="gradient-primary text-primary-foreground font-semibold">
            <ShoppingCart className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {platformFilters.map((p) => (
          <button
            key={p}
            onClick={() => setActivePlatform(p)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              activePlatform === p
                ? "gradient-primary text-primary-foreground font-medium"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No services found. Try adjusting your filters.
            </div>
          )}
          {filtered.map((service) => (
            <div key={service.id} className="glass rounded-xl p-4 flex items-center justify-between hover:glow transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{service.name}</span>
                  <Badge variant="secondary" className="text-xs">{service.platform}</Badge>
                  {service.health_score >= 90 && <Badge className="text-xs bg-primary/20 text-primary border-0">● Active</Badge>}
                  {service.health_score >= 70 && service.health_score < 90 && <Badge className="text-xs bg-warning/20 text-warning border-0">● Slow</Badge>}
                  {service.health_score < 70 && <Badge className="text-xs bg-destructive/20 text-destructive border-0">● Limited</Badge>}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Min: {service.min_order.toLocaleString()}</span>
                  <span>Max: {service.max_order.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading font-bold text-primary">${service.rate.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">per 1K</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
