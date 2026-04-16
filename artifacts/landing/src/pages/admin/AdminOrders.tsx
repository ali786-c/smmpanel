import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, ShoppingCart, DollarSign, TrendingUp, RefreshCw, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  user_id: string;
  link: string;
  quantity: number;
  cost: number;
  profit: number | null;
  provider_cost: number | null;
  status: string;
  external_order_id: number | null;
  created_at: string;
  service_id: string | null;
  userName?: string;
  serviceName?: string;
  selected?: boolean;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const [ordersRes, profilesRes, servicesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, display_name"),
      supabase.from("services").select("id, name"),
    ]);

    const nameMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p) => { nameMap[p.user_id] = p.display_name || "Unknown"; });
    const serviceMap: Record<string, string> = {};
    (servicesRes.data || []).forEach((s) => { serviceMap[s.id] = s.name; });

    const mapped = (ordersRes.data || []).map((o) => ({
      ...o,
      userName: nameMap[o.user_id] || o.user_id.slice(0, 8),
      serviceName: o.service_id ? serviceMap[o.service_id] || "Unknown" : "—",
    }));
    setOrders(mapped);
    setSelectedIds(new Set());
    setLoading(false);
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.userName?.toLowerCase().includes(search.toLowerCase()) ||
      o.link.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.external_order_id?.toString() || "").includes(search);
    const matchStatus = statusFilter === "all" || o.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from("orders").update({ status: bulkStatus }).eq("id", id);
    }
    setOrders((prev) => prev.map((o) => selectedIds.has(o.id) ? { ...o, status: bulkStatus } : o));
    setSelectedIds(new Set());
    setBulkStatus("");
    toast.success(`${ids.length} orders updated to ${bulkStatus}`);
    setBulkLoading(false);
  };

  const totalRevenue = orders.reduce((s, o) => s + o.cost, 0);
  const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
  const statuses = ["all", ...Array.from(new Set(orders.map((o) => o.status.toLowerCase())))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-heading font-bold">{orders.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-2xl font-heading font-bold text-primary">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Profit</p>
          <p className="text-2xl font-heading font-bold text-primary">${totalProfit.toFixed(2)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Margin</p>
          <p className="text-2xl font-heading font-bold">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by user, link, order ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={loadOrders}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="glass rounded-xl p-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="glass rounded-lg p-2 text-sm bg-transparent">
            <option value="">Change status to...</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Partial">Partial</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>
          <Button size="sm" onClick={handleBulkStatusUpdate} disabled={bulkLoading || !bulkStatus} className="gradient-primary text-primary-foreground">
            {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckSquare className="w-3 h-3 mr-1" />}
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-xs">Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">
                <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              </th>
              <th className="pb-3 font-medium">Ext ID</th>
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Service</th>
              <th className="pb-3 font-medium">Qty</th>
              <th className="pb-3 font-medium">Cost</th>
              <th className="pb-3 font-medium">Profit</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className={`border-b border-border/50 last:border-0 ${selectedIds.has(o.id) ? 'bg-primary/5' : ''}`}>
                <td className="py-3">
                  <Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} />
                </td>
                <td className="py-3 font-mono text-xs">{o.external_order_id || "—"}</td>
                <td className="py-3 max-w-[120px] truncate">{o.userName}</td>
                <td className="py-3 max-w-[180px] truncate text-muted-foreground">{o.serviceName}</td>
                <td className="py-3">{o.quantity.toLocaleString()}</td>
                <td className="py-3 font-heading font-semibold">${o.cost.toFixed(2)}</td>
                <td className="py-3 text-primary font-semibold">${(o.profit || 0).toFixed(2)}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.status.toLowerCase() === "completed" ? "bg-primary/10 text-primary"
                    : o.status.toLowerCase() === "pending" ? "bg-yellow-500/10 text-yellow-500"
                    : o.status.toLowerCase() === "canceled" || o.status.toLowerCase() === "cancelled" ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-3 text-muted-foreground text-xs">{format(new Date(o.created_at), "MMM d, yyyy")}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
