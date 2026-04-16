import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Search, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface RefundRow {
  id: string;
  order_id: string | null;
  user_id: string;
  amount: number;
  reason: string | null;
  status: string;
  provider_refund_id: string | null;
  created_at: string;
  userName?: string;
}

export default function AdminRefunds() {
  const { user: adminUser } = useAuth();
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    setLoading(true);
    const [refundsRes, profilesRes] = await Promise.all([
      supabase.from("refund_log").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name"),
    ]);
    const nameMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name || "Unknown"; });
    setRefunds((refundsRes.data || []).map((r: any) => ({ ...r, userName: nameMap[r.user_id] || r.user_id.slice(0, 8) })));
    setLoading(false);
  };

  const handleApprove = async (refund: RefundRow) => {
    setActionLoading(refund.id);
    // Credit user wallet
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", refund.user_id).single();
    if (!wallet) { toast.error("Wallet not found"); setActionLoading(null); return; }

    const newBalance = Number(wallet.balance) + refund.amount;
    const { error: walletErr } = await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", refund.user_id);
    if (walletErr) { toast.error("Failed to credit wallet"); setActionLoading(null); return; }

    // Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: refund.user_id,
      type: "refund",
      amount: refund.amount,
      description: `Refund for order ${refund.order_id?.slice(0, 8) || "N/A"}`,
      reference_id: refund.order_id,
      status: "completed",
    });

    // Update refund status
    await supabase.from("refund_log").update({ status: "approved" }).eq("id", refund.id);

    // Update order status if linked
    if (refund.order_id) {
      await supabase.from("orders").update({ status: "Refunded" }).eq("id", refund.order_id);
    }

    // Log activity
    if (adminUser) {
      await supabase.from("activity_log").insert({
        actor_id: adminUser.id,
        action: "refund_approved",
        target_type: "refund",
        target_id: refund.id,
        details: { amount: refund.amount, user_id: refund.user_id },
      });
    }

    setRefunds((prev) => prev.map((r) => r.id === refund.id ? { ...r, status: "approved" } : r));
    toast.success(`$${refund.amount.toFixed(2)} refunded to user`);
    setActionLoading(null);
  };

  const handleReject = async (refundId: string) => {
    setActionLoading(refundId);
    await supabase.from("refund_log").update({ status: "rejected" }).eq("id", refundId);
    setRefunds((prev) => prev.map((r) => r.id === refundId ? { ...r, status: "rejected" } : r));
    toast.success("Refund rejected");
    setActionLoading(null);
  };

  const filtered = refunds.filter((r) => {
    const matchSearch = !search || r.userName?.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search) || (r.order_id || "").includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: refunds.length,
    pending: refunds.filter((r) => r.status === "pending").length,
    approved: refunds.filter((r) => r.status === "approved").length,
    totalAmount: refunds.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0),
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Refunds</p>
          <p className="text-2xl font-heading font-bold">{stats.total}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-heading font-bold text-warning">{stats.pending}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="text-2xl font-heading font-bold text-primary">{stats.approved}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Refunded</p>
          <p className="text-2xl font-heading font-bold text-primary">${stats.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search refunds..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Order</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Reason</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 text-sm">{r.userName}</td>
                <td className="py-3 font-mono text-xs">{r.order_id?.slice(0, 8) || "—"}</td>
                <td className="py-3 font-heading font-semibold text-primary">${r.amount.toFixed(2)}</td>
                <td className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">{r.reason || "—"}</td>
                <td className="py-3">
                  <Badge className={`text-xs ${
                    r.status === "pending" ? "bg-warning/20 text-warning" :
                    r.status === "approved" ? "bg-primary/20 text-primary" :
                    "bg-destructive/20 text-destructive"
                  } border-0`}>{r.status}</Badge>
                </td>
                <td className="py-3 text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</td>
                <td className="py-3">
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleApprove(r)} disabled={actionLoading === r.id} className="text-primary text-xs h-7">
                        {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" /> Approve</>}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(r.id)} disabled={actionLoading === r.id} className="text-destructive text-xs h-7">
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No refunds found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
