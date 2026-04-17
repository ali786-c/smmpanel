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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchServices = async (pageNum = 1, shouldAppend = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: "50",
        platform: activePlatform,
        search: search
      });

      const r = await apiFetch(`/services?${query.toString()}`);
      if (r.ok) {
        const d = await r.json();
        const newBatch = d.data || [];
        setServices(prev => shouldAppend ? [...prev, ...newBatch] : newBatch);
        setHasMore(!!d.next_page_url);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchServices(1, false);
  }, [activePlatform]);

  // Handle Search with debounce (optional, but using a button/trigger for now)
  const handleSearch = () => {
    fetchServices(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchServices(page + 1, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search services..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-secondary/50" 
            />
          </div>
          <Button onClick={handleSearch} size="sm" variant="secondary">Search</Button>
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

      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <p className="text-sm">No services found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
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
                  {services.map((s) => (
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

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={loadMore} 
                disabled={loadingMore}
                variant="outline"
                className="min-w-[200px] glass border-primary/20 hover:bg-primary/10"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading More...</>
                ) : (
                  "Load More Services"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
