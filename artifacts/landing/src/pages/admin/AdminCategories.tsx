import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, GripVertical, Save, Layers } from "lucide-react";

interface CategoryItem {
  name: string;
  count: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from("services").select("category");
    const counts: Record<string, number> = {};
    (data || []).forEach((s: any) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    setCategories(
      Object.entries(counts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, count]) => ({ name, count }))
    );
    setLoading(false);
  };

  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setCategories([...categories, { name, count: 0 }]);
    setNewCategory("");
    toast.success("Category added — assign services to it");
  };

  const handleRename = async (oldName: string) => {
    const newName = renameMap[oldName]?.trim();
    if (!newName || newName === oldName) {
      setRenameMap((prev) => {
        const next = { ...prev };
        delete next[oldName];
        return next;
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("services")
      .update({ category: newName })
      .eq("category", oldName);
    if (error) {
      toast.error("Failed to rename category");
    } else {
      toast.success(`"${oldName}" renamed to "${newName}"`);
      setCategories((prev) =>
        prev.map((c) => (c.name === oldName ? { ...c, name: newName } : c))
      );
      setRenameMap((prev) => {
        const next = { ...prev };
        delete next[oldName];
        return next;
      });
    }
    setSaving(false);
  };

  const handleDelete = async (name: string) => {
    const cat = categories.find((c) => c.name === name);
    if (cat && cat.count > 0) {
      toast.error(`Can't delete — ${cat.count} services use this category`);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.name !== name));
    toast.success("Category removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Service Categories
        </h3>

        {/* Add New */}
        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-secondary/50 flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <Button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="gradient-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Category List */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="glass rounded-xl p-3 flex items-center gap-3"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />

              {renameMap[cat.name] !== undefined ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    value={renameMap[cat.name]}
                    onChange={(e) =>
                      setRenameMap((prev) => ({
                        ...prev,
                        [cat.name]: e.target.value,
                      }))
                    }
                    className="h-8 text-sm bg-secondary/50 flex-1"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRename(cat.name)
                    }
                  />
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleRename(cat.name)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <button
                  className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors"
                  onClick={() =>
                    setRenameMap((prev) => ({ ...prev, [cat.name]: cat.name }))
                  }
                >
                  {cat.name}
                </button>
              )}

              <span className="text-xs text-muted-foreground shrink-0">
                {cat.count} services
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(cat.name)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No categories yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
