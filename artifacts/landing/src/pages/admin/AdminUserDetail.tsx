import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Loader2, Shield, Ban, DollarSign, ShoppingCart,
  Plus, Minus, User, Wallet, Activity, AlertTriangle, Key, RotateCcw
} from "lucide-react";
import { format } from "date-fns";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      const [profileRes, walletRes, ordersRes, txRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("wallets").select("*").eq("user_id", userId).single(),
        supabase.from("orders").select("*, services(name)").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile(profileRes.data);
      setWallet(walletRes.data);
      setOrders(ordersRes.data || []);
      setTransactions(txRes.data || []);
      setRole((roleRes.data || []).find((r: any) => r.role === "admin") ? "admin" : "user");
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const handleWalletAction = async (type: "credit" | "debit") => {
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0 || !userId || !wallet) return;
    if (type === "debit" && amount > wallet.balance) {
      toast.error("Debit exceeds current balance");
      return;
    }
    setActionLoading(true);
    const newBalance = type === "credit" ? wallet.balance + amount : wallet.balance - amount;
    const { error } = await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", userId);
    if (error) { toast.error("Failed"); setActionLoading(false); return; }

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: type === "credit" ? "admin_credit" : "admin_debit",
      amount: type === "credit" ? amount : -amount,
      description: creditNote || `Manual ${type} by admin`,
      status: "completed",
      payment_method: "admin",
    });

    if (adminUser) {
      await supabase.from("activity_log").insert({
        actor_id: adminUser.id,
        action: `wallet_${type}`,
        target_type: "user",
        target_id: userId,
        details: { amount, note: creditNote, previous_balance: wallet.balance, new_balance: newBalance },
      });
    }

    setWallet({ ...wallet, balance: newBalance });
    setCreditAmount("");
    setCreditNote("");
    toast.success(`$${amount.toFixed(2)} ${type === "credit" ? "added to" : "deducted from"} wallet`);
    setActionLoading(false);
  };

  const handleToggleRole = async () => {
    if (!userId) return;
    setActionLoading(true);
    if (role === "admin") {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      setRole("user");
      toast.success("Admin role removed");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      setRole("admin");
      toast.success("Admin role granted");
    }
    setActionLoading(false);
  };

  const handleToggleBan = async () => {
    if (!userId || !profile) return;
    setActionLoading(true);
    const newBanned = !profile.is_banned;
    const { error } = await supabase.from("profiles").update({
      is_banned: newBanned,
      ban_reason: newBanned ? banReason || "Banned by admin" : null,
    }).eq("user_id", userId);

    if (error) { toast.error("Failed to update ban status"); setActionLoading(false); return; }

    if (adminUser) {
      await supabase.from("activity_log").insert({
        actor_id: adminUser.id,
        action: newBanned ? "user_banned" : "user_unbanned",
        target_type: "user",
        target_id: userId,
        details: { reason: banReason },
      });
    }

    setProfile({ ...profile, is_banned: newBanned, ban_reason: newBanned ? banReason : null });
    setBanReason("");
    toast.success(newBanned ? "User banned" : "User unbanned");
    setActionLoading(false);
  };

  const handleRevokeApiKey = async () => {
    if (!userId) return;
    setActionLoading(true);
    const newKey = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("profiles").update({ api_key: newKey }).eq("user_id", userId);
    if (error) {
      toast.error("Failed to revoke API key");
    } else {
      setProfile({ ...profile, api_key: newKey });
      if (adminUser) {
        await supabase.from("activity_log").insert({
          actor_id: adminUser.id,
          action: "api_key_revoked",
          target_type: "user",
          target_id: userId,
          details: { reason: "Admin revoked API key" },
        });
      }
      toast.success("API key revoked and regenerated");
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">User not found</div>;
  }

  const totalSpent = orders.reduce((s: number, o: any) => s + Number(o.cost), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/users")} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Button>

      {/* Ban Alert */}
      {profile.is_banned && (
        <div className="glass rounded-2xl p-4 border border-destructive/30 bg-destructive/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-destructive text-sm">Account Suspended</p>
            <p className="text-xs text-muted-foreground">{profile.ban_reason || "No reason provided"}</p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="glass rounded-2xl p-6 flex flex-wrap items-center gap-4">
        <div className={`w-14 h-14 rounded-full ${profile.is_banned ? 'bg-destructive/20' : 'gradient-primary'} flex items-center justify-center text-xl font-bold ${profile.is_banned ? 'text-destructive' : 'text-primary-foreground'}`}>
          {(profile.display_name || "U").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-xl">{profile.display_name || "Unnamed"}</h2>
          <p className="text-xs text-muted-foreground font-mono">{userId}</p>
          <p className="text-xs text-muted-foreground">Joined {format(new Date(profile.created_at), "PPP")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className={role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}>{role}</Badge>
          {profile.is_banned && <Badge className="bg-destructive/20 text-destructive border-0">Banned</Badge>}
          <Button variant="outline" size="sm" onClick={handleToggleRole} disabled={actionLoading} className="text-xs">
            {role === "admin" ? <><Ban className="w-3 h-3 mr-1" /> Remove Admin</> : <><Shield className="w-3 h-3 mr-1" /> Make Admin</>}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Balance", value: `$${(wallet?.balance || 0).toFixed(2)}`, icon: Wallet },
          { label: "Orders", value: orders.length, icon: ShoppingCart },
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: DollarSign },
          { label: "Active Orders", value: orders.filter((o: any) => ["Pending", "Processing", "In Progress"].includes(o.status)).length, icon: Activity },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="font-heading font-bold text-lg">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ban/Suspend */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Ban className="w-5 h-5 text-destructive" /> Account Suspension
        </h3>
        {!profile.is_banned && (
          <Input
            placeholder="Reason for ban (optional)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="bg-secondary/50"
          />
        )}
        <Button
          variant={profile.is_banned ? "default" : "destructive"}
          onClick={handleToggleBan}
          disabled={actionLoading}
          className={profile.is_banned ? "gradient-primary text-primary-foreground" : ""}
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
          {profile.is_banned ? "Unban User" : "Ban User"}
        </Button>
      </div>

      {/* Wallet Credit/Debit */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" /> Manual Wallet Adjustment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input type="number" placeholder="Amount" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} className="bg-secondary/50" />
          <Input placeholder="Note (optional)" value={creditNote} onChange={(e) => setCreditNote(e.target.value)} className="bg-secondary/50" />
          <div className="flex gap-2">
            <Button onClick={() => handleWalletAction("credit")} disabled={actionLoading || !creditAmount} className="flex-1 gradient-primary text-primary-foreground font-bold">
              <Plus className="w-4 h-4 mr-1" /> Credit
            </Button>
            <Button variant="outline" onClick={() => handleWalletAction("debit")} disabled={actionLoading || !creditAmount} className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold">
              <Minus className="w-4 h-4 mr-1" /> Debit
            </Button>
          </div>
        </div>
      </div>

      {/* API Key Management */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" /> API Key Management
        </h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-xs bg-secondary/50 rounded-xl px-4 py-3 font-mono truncate">
            {profile.api_key ? `${profile.api_key.slice(0, 12)}...${profile.api_key.slice(-8)}` : "No API key"}
          </code>
          <Button
            variant="outline"
            onClick={handleRevokeApiKey}
            disabled={actionLoading}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Revoke & Regenerate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Revoking will immediately invalidate the current key and generate a new one. The user will need to update their integration.</p>
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" /> Recent Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2">ID</th><th className="pb-2">Service</th><th className="pb-2">Cost</th><th className="pb-2">Qty</th><th className="pb-2">Status</th><th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 20).map((o: any) => (
                <tr key={o.id} className="border-b border-border/30">
                  <td className="py-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="py-2 text-xs truncate max-w-[200px]">{o.services?.name || "—"}</td>
                  <td className="py-2 text-xs font-medium">${Number(o.cost).toFixed(2)}</td>
                  <td className="py-2 text-xs">{o.quantity}</td>
                  <td className="py-2"><Badge variant="secondary" className="text-xs">{o.status}</Badge></td>
                  <td className="py-2 text-xs text-muted-foreground">{format(new Date(o.created_at), "PP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Wallet Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2">Type</th><th className="pb-2">Amount</th><th className="pb-2">Method</th><th className="pb-2">Status</th><th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((t: any) => (
                <tr key={t.id} className="border-b border-border/30">
                  <td className="py-2 text-xs capitalize">{t.type}</td>
                  <td className={`py-2 text-xs font-medium ${t.amount > 0 ? "text-primary" : "text-destructive"}`}>{t.amount > 0 ? "+" : ""}${Number(t.amount).toFixed(2)}</td>
                  <td className="py-2 text-xs">{t.payment_method || "—"}</td>
                  <td className="py-2"><Badge variant="secondary" className="text-xs">{t.status}</Badge></td>
                  <td className="py-2 text-xs text-muted-foreground">{format(new Date(t.created_at), "PP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
