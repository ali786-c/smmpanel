import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Search } from "lucide-react";

export default function AdminManualOrder() {
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: "", service_id: "", quantity: "", link: "", charge_user: true });
  const [submitting, setSubmitting] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    apiFetch("/admin/services?per_page=500").then(r => r.ok ? r.json() : null).then(d => setServices(d?.data ?? d?.services ?? []));
    apiFetch("/admin/users?per_page=200").then(r => r.ok ? r.json() : null).then(d => setUsers(d?.data ?? d?.users ?? []));
  }, []);

  const handleServiceSelect = (svc: any) => {
    setSelectedService(svc);
    setForm(f => ({ ...f, service_id: svc.id, quantity: String(svc.min_quantity ?? 100) }));
    setServiceSearch(svc.name);
  };

  const filteredServices = serviceSearch && !selectedService
    ? services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).slice(0, 10)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id || !form.service_id || !form.link || !form.quantity) {
      toast.error("Fill all fields"); return;
    }
    setSubmitting(true);
    const res = await apiFetch("/admin/orders/manual", {
      method: "POST",
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity), charge_user: form.charge_user }),
    });
    if (res.ok) { toast.success("Order created"); setForm({ user_id: "", service_id: "", quantity: "", link: "", charge_user: true }); setSelectedService(null); setServiceSearch(""); }
    else { const e = await res.json(); toast.error(e.message ?? "Order creation failed"); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> Create Manual Order</h2>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
        <div>
          <Label className="text-xs">User</Label>
          <select required value={form.user_id} onChange={e => setForm(f => ({...f, user_id: e.target.value}))}
            className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground mt-1.5">
            <option value="">Select user…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
        </div>

        <div className="relative">
          <Label className="text-xs">Service</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input value={serviceSearch} onChange={e => { setServiceSearch(e.target.value); setSelectedService(null); setForm(f => ({...f, service_id: ""})); }}
              placeholder="Search service…" className="pl-9 text-sm" />
          </div>
          {filteredServices.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
              {filteredServices.map(s => (
                <button key={s.id} type="button" onClick={() => handleServiceSelect(s)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground ml-2">${parseFloat(s.price || 0).toFixed(4)} · {s.min_quantity}–{s.max_quantity}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedService && (
          <div className="bg-secondary/30 rounded-xl p-3 text-xs">
            <p className="font-medium">{selectedService.name}</p>
            <p className="text-muted-foreground">Price: ${parseFloat(selectedService.price || 0).toFixed(4)} · Min: {selectedService.min_quantity} · Max: {selectedService.max_quantity}</p>
          </div>
        )}

        <div>
          <Label className="text-xs">Target URL / Link</Label>
          <Input required value={form.link} onChange={e => setForm(f => ({...f, link: e.target.value}))} placeholder="https://instagram.com/…" className="mt-1.5 text-sm" />
        </div>

        <div>
          <Label className="text-xs">Quantity</Label>
          <Input required type="number" min={selectedService?.min_quantity ?? 1} max={selectedService?.max_quantity}
            value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} className="mt-1.5 text-sm" />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.charge_user} onChange={e => setForm(f => ({...f, charge_user: e.target.checked}))} className="rounded" />
          Deduct from user balance
        </label>

        <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground font-bold gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          {submitting ? "Creating…" : "Create Order"}
        </Button>
      </form>
    </div>
  );
}
