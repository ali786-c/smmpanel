import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileText, Check, X, Edit2, MessageSquare } from "lucide-react";

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", published: false });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/admin/blog");
    if (res.ok) { const d = await res.json(); setPosts(d.data ?? d.posts ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (post: any) => {
    setEditing(post);
    setForm({ title: post.title, slug: post.slug ?? "", content: post.content ?? "", excerpt: post.excerpt ?? "", published: post.published ?? false });
  };

  const startNew = () => {
    setEditing({ isNew: true });
    setForm({ title: "", slug: "", content: "", excerpt: "", published: false });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editing?.isNew;
    const url = isNew ? "/admin/blog" : `/admin/blog/${editing.id}`;
    const method = isNew ? "POST" : "PATCH";
    const res = await apiFetch(url, { method, body: JSON.stringify(form) });
    if (res.ok) { toast.success(isNew ? "Post created" : "Post updated"); setEditing(null); load(); }
    else { const e = await res.json(); toast.error(e.message ?? "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete blog post?")) return;
    const res = await apiFetch(`/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(); }
    else toast.error("Delete failed");
  };

  if (editing) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> {editing.isNew ? "New Post" : "Edit Post"}</h2>
          <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="w-4 h-4" /> Cancel</Button>
        </div>
        <form onSubmit={handleSave} className="glass rounded-2xl p-5 space-y-3">
          <Input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}))} placeholder="Post title" className="text-sm font-medium" />
          <Input value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} placeholder="slug-url" className="text-sm" />
          <Textarea required value={form.excerpt} onChange={e => setForm(f => ({...f, excerpt: e.target.value}))} placeholder="Short excerpt…" className="text-sm resize-none h-16" />
          <Textarea required value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Full content (supports HTML/markdown)…" className="text-sm resize-none h-48" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({...f, published: e.target.checked}))} className="rounded" />
              Published
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="gradient-primary text-primary-foreground gap-2"><Check className="w-4 h-4" /> Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)} className="gap-2"><X className="w-4 h-4" /> Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Blog Posts</h2>
        <Button onClick={startNew} className="gradient-primary text-primary-foreground gap-2 h-9"><Plus className="w-4 h-4" /> New Post</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No blog posts yet</div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium">{p.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.published ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{p.published ? "Published" : "Draft"}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.excerpt ?? p.content?.slice(0, 100) ?? ""}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 text-primary" 
                  title="Send to Discord"
                  onClick={async () => {
                    const res = await apiFetch(`/admin/blog/${p.id}/send-to-discord`, { method: "POST" });
                    if (res.ok) toast.success("Sent to Discord");
                    else toast.error("Failed to send");
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(p)}><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
