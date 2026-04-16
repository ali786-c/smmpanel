import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Service {
  id: string; name: string; rate: number; updated_at: string; external_service_id: number;
}

export default function Updates() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    apiFetch("/services?per_page=100&sort=updated_at&order=desc")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setServices(d?.data ?? d?.services ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = services.filter(s =>
    search ? s.name.toLowerCase().includes(search.toLowerCase()) || String(s.external_service_id).includes(search) : true
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary/50" />
        </div>
        <button onClick={() => setFilter("All")} className={`px-3 py-1.5 rounded-lg text-sm ${filter === "All" ? "gradient-primary text-primary-foreground font-medium" : "glass text-muted-foreground"}`}>All</button>
      </div>
      <div className="glass rounded-2xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium text-xs">Service</th>
              <th className="pb-3 font-medium text-xs">Date</th>
              <th className="pb-3 font-medium text-xs text-right">Update</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 text-xs max-w-[400px]"><span className="text-muted-foreground mr-1">{s.external_service_id}</span> - {s.name}</td>
                <td className="py-3 text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</td>
                <td className="py-3 text-right"><Badge className="text-xs bg-primary/20 text-primary border-0">Rate: ${Number(s.rate).toFixed(4)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
