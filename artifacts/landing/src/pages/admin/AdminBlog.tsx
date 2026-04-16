import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  meta_title: string;
  meta_description: string;
  read_time: number;
  published_at: string | null;
  created_at: string;
}

const emptyPost = {
  title: "", slug: "", excerpt: "", content: "", category: "Marketing",
  tags: [] as string[], status: "draft", meta_title: "", meta_description: "", read_time: 5,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPost);
    setTagsInput("");
    setDialogOpen(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
      category: p.category, tags: p.tags, status: p.status,
      meta_title: p.meta_title, meta_description: p.meta_description, read_time: p.read_time,
    });
    setTagsInput(p.tags.join(", "));
    setDialogOpen(true);
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    setSaving(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...form,
      tags,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Post updated");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Post created");
    }
    setSaving(false);
    setDialogOpen(false);
    loadPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Post deleted"); loadPosts(); }
  };

  const togglePublish = async (p: BlogPost) => {
    const newStatus = p.status === "published" ? "draft" : "published";
    await supabase.from("blog_posts").update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", p.id);
    toast.success(newStatus === "published" ? "Published" : "Unpublished");
    loadPosts();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{posts.length} posts total</p>
        </div>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> New Post
        </Button>
      </div>

      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 max-w-[250px] truncate font-medium">{p.title}</td>
                <td className="py-3 text-muted-foreground">{p.category}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>{p.status}</span>
                </td>
                <td className="py-3 text-muted-foreground text-xs">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                <td className="py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => togglePublish(p)} title={p.status === "published" ? "Unpublish" : "Publish"}>
                    {p.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No blog posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({ ...f, title, slug: editing ? f.slug : autoSlug(title) }));
              }} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Content (HTML)</Label>
              <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={10} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <Label>Read Time (min)</Label>
                <Input type="number" value={form.read_time} onChange={(e) => setForm((f) => ({ ...f, read_time: parseInt(e.target.value) || 5 }))} />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="seo, marketing, growth" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta Title</Label>
                <Input value={form.meta_title} onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))} />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Input value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} />
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
