import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowLeft, User, Shield, DollarSign, ShoppingCart, Edit2, Check, X } from "lucide-react";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await apiFetch(`/admin/users/${userId}`);
    if (res.ok) {
      const d = await res.json();
      const u = d.user ?? d;
      setUser(u);
      setOrders(d.orders ?? u.orders ?? []);
      setForm({ display_name: u.profile?.display_name ?? u.display_name ?? "", phone: u.profile?.phone ?? u.phone ?? "" });
    } else navigate("/admin/users");
    setLoading(false);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const handleSave = async () => {
    const res = await apiFetch(`/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(form) });
    if (res.ok) { toast.success("Updated"); setEditing(false); load(); }
    else toast.error("Update failed");
  };

  const handleAdjust = async () => {
    if (!adjustAmount) return;
    const res = await apiFetch(`/admin/users/${userId}/adjust-balance`, {
      method: "POST", body: JSON.stringify({ amount: parseFloat(adjustAmount), reason: adjustNote || "Admin adjustment" }),
    });
    if (res.ok) { toast.success("Balance adjusted"); setAdjustAmount(""); setAdjustNote(""); load(); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed"); }
  };

  const handleNotify = async () => {
    if (!notifyMsg.trim()) return;
    const res = await apiFetch(`/admin/users/${userId}/notify`, {
      method: "POST",
      body: JSON.stringify({ title: "Message from Admin", message: notifyMsg, type: "info" }),
    });
    if (res.ok) { toast.success("Notification sent"); setNotifyMsg(""); }
    else toast.error("Failed to notify");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user) return null;

  const balance = parseFloat(user.wallet?.balance ?? user.balance ?? 0);
  const email = user.email;
  const displayName = user.profile?.display_name ?? user.display_name ?? "";
  const roles = user.roles ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="font-heading font-bold text-lg">User Detail</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Profile</h3>
            {editing ? (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={handleSave}><Check className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}><Edit2 className="w-3.5 h-3.5" /></Button>}
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{email}</p></div>
            <div>
              <span className="text-muted-foreground text-xs">Display Name</span>
              {editing ? <Input value={form.display_name} onChange={e => setForm((f: any) => ({...f, display_name: e.target.value}))} className="mt-1 h-8 text-sm" /> : <p className="font-medium">{displayName || "—"}</p>}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Phone</span>
              {editing ? <Input value={form.phone} onChange={e => setForm((f: any) => ({...f, phone: e.target.value}))} className="mt-1 h-8 text-sm" /> : <p className="font-medium">{user.profile?.phone ?? user.phone ?? "—"}</p>}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Role</span>
              <p className="font-medium">
                {roles.map((r: any, idx: number) => {
                  const roleName = typeof r === 'string' ? r : (r?.role ?? 'User');
                  return (
                    <span key={idx} className={`text-xs px-2 py-0.5 rounded-full mr-1 ${roleName === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {roleName}
                    </span>
                  );
                })}
              </p>
            </div>
            <div><span className="text-muted-foreground text-xs">Joined</span><p>{new Date(user.created_at).toLocaleDateString()}</p></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4 text-primary" /> Wallet & Adjust</h3>
            <p className="text-2xl font-heading font-bold text-primary mb-3">${balance.toFixed(2)}</p>
            <div className="flex gap-2">
              <Input type="number" step="0.01" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="Amount (- to deduct)" className="text-sm h-9" />
              <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Note" className="text-sm h-9" />
              <Button onClick={handleAdjust} disabled={!adjustAmount} className="gradient-primary text-primary-foreground h-9 px-3">Apply</Button>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-primary" /> Send Notification</h3>
            <div className="flex gap-2">
              <Input value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)} placeholder="Message…" className="text-sm h-9" />
              <Button onClick={handleNotify} disabled={!notifyMsg.trim()} className="gradient-primary text-primary-foreground h-9 px-3">Send</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-heading font-semibold flex items-center gap-2 mb-4"><ShoppingCart className="w-4 h-4 text-primary" /> Orders ({orders.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Service","Link","Qty","Cost","Status","Date"].map(h => (
                  <th key={h} className="text-left pb-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No orders</td></tr>
              ) : orders.slice(0, 20).map((o: any) => (
                <tr key={o.id} className="border-b border-border/30">
                  <td className="py-2.5 text-xs truncate max-w-[120px]">{o.service_name ?? o.service?.name ?? "—"}</td>
                  <td className="py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">{o.link}</td>
                  <td className="py-2.5 text-xs">{o.quantity}</td>
                  <td className="py-2.5 text-xs font-bold">${parseFloat(o.cost || 0) > 0 && parseFloat(o.cost || 0) < 0.01 ? parseFloat(o.cost || 0).toFixed(4) : parseFloat(o.cost || 0).toFixed(2)}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "Completed" ? "bg-primary/20 text-primary" : o.status === "Cancelled" ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-400"}`}>{o.status}</span>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
