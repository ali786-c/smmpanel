import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusTabs = ["All", "Pending", "In Progress", "Completed", "Partial", "Processing", "Cancelled", "Refunded"];

const statusVariant: Record<string, string> = {
  Completed: "bg-primary/20 text-primary border-0",
  "In Progress": "bg-info/20 text-info border-0",
  Processing: "bg-warning/20 text-warning border-0",
  Pending: "bg-warning/20 text-warning border-0",
  Partial: "bg-warning/20 text-warning border-0",
  Cancelled: "bg-destructive/20 text-destructive border-0",
  Refunded: "bg-destructive/20 text-destructive border-0",
};

interface Order {
  id: string;
  link: string;
  quantity: number;
  remains: number | null;
  start_count: number | null;
  status: string;
  cost: number;
  created_at: string;
  services?: { name: string } | null;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, link, quantity, remains, start_count, status, cost, created_at, services(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setOrders((data as any) || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = orders.filter((o) => {
    const matchesTab = activeTab === "All" || o.status === activeTab;
    const matchesSearch = search
      ? o.id.includes(search) || o.link.toLowerCase().includes(search.toLowerCase()) || ((o.services as any)?.name || "").toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesTab && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ["ID", "Date", "Service", "Link", "Quantity", "Start Count", "Remains", "Cost", "Status"];
    const rows = filtered.map((o) => [
      o.id,
      new Date(o.created_at).toISOString(),
      (o.services as any)?.name || "",
      o.link,
      o.quantity,
      o.start_count ?? "",
      o.remains ?? "",
      Number(o.cost).toFixed(4),
      o.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported to CSV");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-0 overflow-x-auto">
        {statusTabs.map((tab) => {
          const count = tab === "All" ? orders.length : orders.filter((o) => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab} {count > 0 && <span className="ml-1 text-muted-foreground">({count})</span>}
            </button>
          );
        })}
        <div className="ml-auto shrink-0 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs h-8">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs w-40 bg-secondary/50"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium text-xs">ID</th>
              <th className="pb-3 font-medium text-xs">Date</th>
              <th className="pb-3 font-medium text-xs">Link</th>
              <th className="pb-3 font-medium text-xs">Charge</th>
              <th className="pb-3 font-medium text-xs">Start count</th>
              <th className="pb-3 font-medium text-xs">Quantity</th>
              <th className="pb-3 font-medium text-xs">Service</th>
              <th className="pb-3 font-medium text-xs">Remains</th>
              <th className="pb-3 font-medium text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  No campaigns found.
                </td>
              </tr>
            )}
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 cursor-pointer">
                <td className="py-3 font-mono text-xs">
                  <Link to={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">
                    {order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-3 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="py-3 text-xs max-w-[150px] truncate">
                  <a href={order.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {order.link}
                  </a>
                </td>
                <td className="py-3 font-heading font-semibold text-xs">${Number(order.cost).toFixed(2)}</td>
                <td className="py-3 text-xs">{order.start_count ?? "—"}</td>
                <td className="py-3 text-xs">{order.quantity.toLocaleString()}</td>
                <td className="py-3 text-xs max-w-[150px] truncate">{(order.services as any)?.name || "—"}</td>
                <td className="py-3 text-xs text-primary">{(order.remains || 0).toLocaleString()}</td>
                <td className="py-3">
                  <Badge className={`text-xs ${statusVariant[order.status] || ""}`}>{order.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
