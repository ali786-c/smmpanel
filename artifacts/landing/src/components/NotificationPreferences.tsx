import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { userId?: string; email?: string; }

export default function NotificationPreferences({ userId, email }: Props) {
  const [prefs, setPrefs] = useState({ order_updates: true, wallet_transactions: true, service_updates: true, promotions: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    apiFetch("/profile/notification-preferences")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.preferences || d) {
          const p = d.preferences ?? d;
          setPrefs({
            order_updates: p.order_updates ?? true,
            wallet_transactions: p.wallet_transactions ?? true,
            service_updates: p.service_updates ?? true,
            promotions: p.promotions ?? false,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch("/profile/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    if (res.ok) toast.success("Notification preferences saved");
    else toast.error("Failed to save preferences");
  };

  const items = [
    { key: "order_updates" as const, label: "Order status updates", desc: "Get notified when your campaign status changes" },
    { key: "wallet_transactions" as const, label: "Wallet transactions", desc: "Receive alerts for deposits and refunds" },
    { key: "service_updates" as const, label: "Service updates", desc: "New services and rate changes" },
    { key: "promotions" as const, label: "Promotions & offers", desc: "Special deals and bonus opportunities" },
  ];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h3 className="font-heading font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notification Preferences</h3>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map(item => (
              <label key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <input type="checkbox" checked={prefs[item.key]} onChange={e => setPrefs(p => ({ ...p, [item.key]: e.target.checked }))} className="w-4 h-4 accent-primary" />
              </label>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-bold py-5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} SAVE PREFERENCES
          </Button>
          <p className="text-xs text-muted-foreground">Email notifications are sent to {email}</p>
        </>
      )}
    </div>
  );
}
