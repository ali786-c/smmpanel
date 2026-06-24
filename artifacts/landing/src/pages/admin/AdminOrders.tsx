import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw, ShoppingCart, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  "Completed": "bg-primary/20 text-primary",
  "In progress": "bg-blue-500/20 text-blue-400",
  "Cancelled": "bg-destructive/20 text-destructive",
  "Pending": "bg-yellow-500/20 text-yellow-400",
  "Partial": "bg-orange-500/20 text-orange-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const perPage = 30;

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length && orders.length > 0) setSelectedIds([]);
    else setSelectedIds(orders.map(o => o.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkSync = async () => {
    setIsSyncingAll(true);
    const res = await apiFetch("/admin/orders/bulk-sync", { 
      method: "POST",
      body: JSON.stringify({ order_ids: selectedIds.length > 0 ? selectedIds : null })
    });
    if (res.ok) {
      const d = await res.json();
      toast.success(`Checked ${d.checked} orders. Updated: ${d.updated}, Refunded: ${d.refunded}`);
      setSelectedIds([]);
      load(page);
    } else {
      toast.error("Bulk sync failed");
    }
    setIsSyncingAll(false);
  };

  const load = async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), per_page: String(perPage) });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await apiFetch(`/admin/orders?${params}`);
    if (res.ok) {
      const d = await res.json();
      setOrders(d.data ?? []);
      setTotal(d.total ?? 0);
      setRevenue(d.total_revenue ?? 0);
      setProfit(d.total_profit ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(1); };

  const handleSyncStatus = async (orderId: string) => {
    setSyncingId(orderId);
    const res = await apiFetch(`/admin/orders/${orderId}/sync-status`, { method: "POST" });
    if (res.ok) { 
      toast.success("Status synced"); 
      load(page); 
    } else { 
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || e.message || "Sync failed"); 
    }
    setSyncingId(null);
  };

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    const res = await apiFetch(`/admin/orders/${orderId}/retry`, { method: "POST" });
    if (res.ok) {
      toast.success("Order sent to provider");
      load(page);
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || e.message || "Retry failed");
      load(page);
    }
    setRetryingId(null);
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm("Issue refund for this order?")) return;
    const res = await apiFetch(`/admin/orders/${orderId}/refund`, { method: "POST" });
    if (res.ok) { toast.success("Refund issued"); load(page); }
    else { const e = await res.json(); toast.error(e.message ?? "Refund failed"); }
  };

  const pages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" /> Orders <span className="text-muted-foreground text-sm font-normal">({total})</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleBulkSync} 
            disabled={isSyncingAll}
            variant="outline" 
            size="sm" 
            className="h-9 gap-2 text-primary border-primary/20 hover:bg-primary/5"
          >
            {isSyncingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {selectedIds.length > 0 ? `Sync Selected (${selectedIds.length})` : "Sync All Orders"}
          </Button>
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background text-sm px-3 text-foreground">
              <option value="all">All Statuses</option>
              {["Pending","In progress","Completed","Cancelled","Partial"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, link, ID…" className="w-48 h-9 text-sm" />
            <Button type="submit" size="sm" variant="outline"><Search className="w-4 h-4" /></Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass p-3 rounded-xl border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total</p>
          <p className="text-sm font-bold">{total}</p>
        </div>
        <div className="glass p-3 rounded-xl border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Revenue</p>
          <p className="text-sm font-bold text-primary">${revenue.toFixed(2)}</p>
        </div>
        <div className="glass p-3 rounded-xl border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Profit</p>
          <p className="text-sm font-bold text-primary">${profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-3 w-8">
                  <input type="checkbox" checked={selectedIds.length === orders.length && orders.length > 0} onChange={toggleSelectAll} className="rounded border-border" />
                </th>
                {["ID","User","Service","Link","Qty","Cost","Profit","Status","Date","Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">No orders found</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className={`border-b border-border/30 hover:bg-secondary/20 ${selectedIds.includes(o.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} className="rounded border-border" />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{o.external_order_id || String(o.id).slice(0,8)}</td>
                  <td className="px-3 py-2.5 text-xs">{o.user_email ?? o.user?.email ?? o.user_id?.slice(0,8)}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <div className="truncate max-w-[150px]">{o.service_name ?? o.service?.name ?? "—"}</div>
                    {o.notes && String(o.notes).includes("[Provider Error]") && (
                      <div className="text-[10px] text-destructive mt-1 whitespace-normal max-w-[150px] font-medium leading-tight">
                        {o.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs truncate max-w-[120px] text-muted-foreground">{o.link}</td>
                  <td className="px-3 py-2.5 text-xs">{o.quantity}</td>
                  <td className="px-3 py-2.5 text-xs font-bold">${parseFloat(o.cost || 0) > 0 && parseFloat(o.cost || 0) < 0.01 ? parseFloat(o.cost || 0).toFixed(4) : parseFloat(o.cost || 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-xs text-primary">${parseFloat(o.profit || 0) > 0 && parseFloat(o.profit || 0) < 0.01 ? parseFloat(o.profit || 0).toFixed(4) : parseFloat(o.profit || 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? "bg-secondary text-muted-foreground"}`}>{o.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {!o.external_order_id && o.status === "Pending" ? (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-blue-400" disabled={retryingId === o.id} onClick={() => handleRetry(o.id)} title="Retry Provider">
                          {retryingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />} Retry
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={syncingId === o.id || !o.external_order_id}
                          onClick={() => handleSyncStatus(o.id)} title={o.external_order_id ? "Sync status" : "No external ID to sync"}>
                          {syncingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        </Button>
                      )}
                      {o.status !== "Cancelled" && o.status !== "Completed" && o.status !== "Refunded" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => handleRefund(o.id)}>Refund</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Page {page} of {pages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p); }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
