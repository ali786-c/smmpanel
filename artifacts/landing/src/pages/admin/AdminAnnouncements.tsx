import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Megaphone, Check, X } from "lucide-react";

export default function AdminAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/announcements");
    if (res.ok) { const d = await res.json(); setItems(d.data ?? d.announcements ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? "PATCH" : "POST";
    const url = editId ? `/admin/announcements/${editId}` : "/admin/announcements";
    const res = await apiFetch(url, { method, body: JSON.stringify(form) });
    if (res.ok) { toast.success(editId ? "Updated" : "Created"); setCreating(false); setEditId(null); setForm({ title: "", message: "", type: "info" }); load(); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    const res = await apiFetch(`/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(); }
    else toast.error("Delete failed");
  };

  const TYPE_COLORS: Record<string, string> = {
    info: "bg-blue-500/20 text-blue-400",
    success: "bg-primary/20 text-primary",
    warning: "bg-yellow-500/20 text-yellow-400",
    error: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Announcements</h2>
        <Button onClick={() => { setCreating(true); setEditId(null); setForm({ title: "", message: "", type: "info" }); }} className="gradient-primary text-primary-foreground gap-2 h-9">
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>

      {(creating || editId) && (
        <div className="glass rounded-2xl p-5">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Title" className="text-sm" />
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                className="h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <Textarea required value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="Message content…" className="text-sm resize-none h-24" />
            <div className="flex gap-2">
              <Button type="submit" className="gradient-primary text-primary-foreground gap-2"><Check className="w-4 h-4" /> {editId ? "Update" : "Publish"}</Button>
              <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditId(null); }} className="gap-2"><X className="w-4 h-4" /> Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No announcements</div>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{a.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type] ?? TYPE_COLORS.info}`}>{a.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setEditId(a.id); setCreating(false); setForm({ title: a.title, message: a.message, type: a.type ?? "info" }); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
