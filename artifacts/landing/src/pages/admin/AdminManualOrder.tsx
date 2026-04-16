import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShoppingCart } from "lucide-react";

interface UserOption { user_id: string; display_name: string | null; }
interface ServiceOption { id: string; name: string; rate: number; external_service_id: number; min_order: number; max_order: number; }

export default function AdminManualOrder() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deductBalance, setDeductBalance] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("user_id, display_name"),
      supabase.from("services").select("id, name, rate, external_service_id, min_order, max_order").eq("is_active", true).order("display_order"),
    ]).then(([profilesRes, servicesRes]) => {
      setUsers(profilesRes.data || []);
      setServices(servicesRes.data || []);
      setLoading(false);
    });
  }, []);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const qty = parseInt(quantity) || 0;
  const cost = selectedService ? parseFloat(((selectedService.rate / 1000) * qty).toFixed(4)) : 0;

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedServiceId || !link.trim() || !qty || !adminUser) return;
    setSubmitting(true);
    try {
      // Insert order directly
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: selectedUserId,
        service_id: selectedServiceId,
        link: link.trim(),
        quantity: qty,
        cost,
        profit: 0,
        provider_cost: 0,
        status: "Processing",
      }).select().single();

      if (error) throw error;

      if (deductBalance) {
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", selectedUserId).single();
        if (wallet) {
          await supabase.from("wallets").update({ balance: Math.max(0, Number(wallet.balance) - cost) }).eq("user_id", selectedUserId);
          await supabase.from("wallet_transactions").insert({
            user_id: selectedUserId,
            type: "order",
            amount: -cost,
            description: `Manual order by admin`,
            reference_id: order?.id,
            status: "completed",
          });
        }
      }

      await supabase.from("activity_log").insert({
        actor_id: adminUser.id,
        action: "manual_order_created",
        target_type: "order",
        target_id: order?.id,
        details: { user_id: selectedUserId, service_id: selectedServiceId, quantity: qty, cost },
      });

      toast.success("Order created successfully");
      setLink("");
      setQuantity("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" /> Create Order for User
        </h3>

        <div className="space-y-1">
          <Label className="text-sm">User</Label>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full glass rounded-xl p-3 text-sm bg-transparent focus:outline-none">
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>{u.display_name || u.user_id.slice(0, 12)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Service</Label>
          <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full glass rounded-xl p-3 text-sm bg-transparent focus:outline-none">
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.external_service_id} - {s.name} — ${s.rate.toFixed(4)}/1K</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Link</Label>
          <Input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} className="bg-secondary/50" />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Quantity</Label>
          <Input type="number" placeholder={selectedService ? `${selectedService.min_order} - ${selectedService.max_order}` : "Select service"} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-secondary/50" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="deduct" checked={deductBalance} onChange={(e) => setDeductBalance(e.target.checked)} className="rounded" />
          <Label htmlFor="deduct" className="text-sm cursor-pointer">Deduct from user's wallet</Label>
        </div>

        <div className="glass rounded-xl p-3 flex justify-between">
          <span className="text-sm text-muted-foreground">Cost</span>
          <span className="font-heading font-bold text-primary">${cost.toFixed(4)}</span>
        </div>

        <Button onClick={handleSubmit} disabled={submitting || !selectedUserId || !selectedServiceId || !link.trim() || !qty} className="w-full gradient-primary text-primary-foreground font-bold">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : "Create Order"}
        </Button>
      </div>
    </div>
  );
}
