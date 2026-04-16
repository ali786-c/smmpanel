import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Megaphone, Send } from "lucide-react";

export default function AdminMassNotification() {
  const [form, setForm] = useState({ title: "", message: "", target: "all" });
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Send notification to all ${form.target} users?`)) return;
    setSending(true);
    const res = await apiFetch("/admin/notifications/mass-send", { method: "POST", body: JSON.stringify(form) });
    if (res.ok) { const d = await res.json(); toast.success(`Sent to ${d.sent ?? d.recipients ?? "all"} users`); setLastResult(d); setForm(f => ({ ...f, title: "", message: "" })); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed to send"); }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Mass Notification</h2>

      <form onSubmit={handleSend} className="glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Target Audience</label>
          <select value={form.target} onChange={e => setForm(f => ({...f, target: e.target.value}))}
            className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground">
            <option value="all">All Users</option>
            <option value="active">Active Users (ordered in last 30 days)</option>
            <option value="inactive">Inactive Users</option>
            <option value="low_balance">Low Balance Users</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Notification Title</label>
          <Input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Notification title" className="text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
          <Textarea required value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="Your message to users…" className="text-sm resize-none h-28" />
        </div>
        <Button type="submit" disabled={sending} className="w-full gradient-primary text-primary-foreground font-bold gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending…" : "Send Notification"}
        </Button>
      </form>

      {lastResult && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-sm mb-2">Last Send Result</h3>
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{JSON.stringify(lastResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
