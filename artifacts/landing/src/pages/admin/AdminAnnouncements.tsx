import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", content: "", is_active: true, priority: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("priority", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", is_active: true, priority: 0 });
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, is_active: a.is_active, priority: a.priority });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("announcements").update(form).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Updated");
    } else {
      const { error } = await supabase.from("announcements").insert(form);
      if (error) toast.error(error.message); else toast.success("Created");
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const toggleActive = async (a: Announcement) => {
    await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    toast.success(a.is_active ? "Deactivated" : "Activated");
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{items.length} announcements</p>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> New Announcement
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className={`glass rounded-2xl p-5 ${!a.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <h4 className="font-heading font-semibold">{a.title}</h4>
                  {a.priority > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Priority {a.priority}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(a.created_at), "MMM d, yyyy")}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggleActive(a)} title={a.is_active ? "Deactivate" : "Activate"}>
                  <Switch checked={a.is_active} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No announcements yet.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
