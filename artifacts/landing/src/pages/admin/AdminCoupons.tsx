import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Tag, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_amount: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: "", max_uses: "", min_order_amount: "", expires_at: "",
  });

  useEffect(() => {
    supabase.from("coupons").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setCoupons((data as Coupon[]) || []); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) { toast.error("Code and value required"); return; }
    const { data, error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      expires_at: form.expires_at || null,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setCoupons([data as Coupon, ...coupons]);
    setForm({ code: "", discount_type: "percentage", discount_value: "", max_uses: "", min_order_amount: "", expires_at: "" });
    setShowForm(false);
    toast.success("Coupon created");
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !active } : c));
    toast.success(active ? "Coupon disabled" : "Coupon enabled");
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coupon deleted");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Coupon Codes</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gradient-primary text-primary-foreground font-bold gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="bg-secondary/50 uppercase" />
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="bg-secondary/50 rounded-md px-3 text-sm border border-input">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
            <Input type="number" placeholder="Discount value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="bg-secondary/50" />
            <Input type="number" placeholder="Max uses (blank=unlimited)" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="bg-secondary/50" />
            <Input type="number" placeholder="Min order ($)" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="bg-secondary/50" />
            <Input type="datetime-local" placeholder="Expires at" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="bg-secondary/50" />
          </div>
          <Button onClick={handleCreate} className="gradient-primary text-primary-foreground font-bold">CREATE</Button>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-3">Code</th><th className="pb-3">Type</th><th className="pb-3">Value</th><th className="pb-3">Used</th><th className="pb-3">Min Order</th><th className="pb-3">Expires</th><th className="pb-3">Status</th><th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No coupons yet</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-3 font-mono font-bold text-primary">{c.code}</td>
                  <td className="py-3">{c.discount_type === "percentage" ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}</td>
                  <td className="py-3 font-medium">{c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                  <td className="py-3">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td className="py-3">${c.min_order_amount}</td>
                  <td className="py-3 text-xs text-muted-foreground">{c.expires_at ? format(new Date(c.expires_at), "PP") : "Never"}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                      {c.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleCoupon(c.id, c.is_active)}>
                      {c.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteCoupon(c.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
