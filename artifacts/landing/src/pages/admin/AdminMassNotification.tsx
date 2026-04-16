import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Send, Bell, Users, Filter } from "lucide-react";

export default function AdminMassNotification() {
  const { user: adminUser } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "top_spenders">("all");
  const [sending, setSending] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    supabase.from("profiles").select("user_id", { count: "exact" }).then(({ count }) => {
      setUserCount(count || 0);
    });
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || !adminUser) return;
    setSending(true);

    try {
      // Get target users
      let query = supabase.from("profiles").select("user_id");
      if (filter === "active") {
        // Users who placed orders in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: activeUsers } = await supabase
          .from("orders")
          .select("user_id")
          .gte("created_at", thirtyDaysAgo);
        const uniqueIds = [...new Set((activeUsers || []).map((o) => o.user_id))];
        if (uniqueIds.length === 0) {
          toast.error("No active users found");
          setSending(false);
          return;
        }
        query = query.in("user_id", uniqueIds);
      }

      const { data: users } = await query;
      if (!users?.length) {
        toast.error("No users found");
        setSending(false);
        return;
      }

      // Insert notifications in batches
      const notifications = users.map((u) => ({
        user_id: u.user_id,
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || null,
      }));

      const batchSize = 50;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await supabase.from("notifications").insert(batch);
      }

      // Log activity
      await supabase.from("activity_log").insert({
        actor_id: adminUser.id,
        action: "mass_notification_sent",
        target_type: "notification",
        details: { title, type, filter, recipient_count: users.length },
      });

      toast.success(`Notification sent to ${users.length} users`);
      setTitle("");
      setMessage("");
      setLink("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" /> Mass Notification
        </h3>

        {/* Audience Filter */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Audience
          </Label>
          <div className="flex gap-2">
            {([
              { value: "all", label: "All Users", count: userCount },
              { value: "active", label: "Active (30d)" },
              { value: "top_spenders", label: "Top Spenders" },
            ] as const).map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(opt.value)}
                className="text-xs"
              >
                <Users className="w-3 h-3 mr-1" />
                {opt.label}
                {"count" in opt && <span className="ml-1 opacity-70">({opt.count})</span>}
              </Button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label className="text-sm">Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full glass rounded-xl p-3 text-sm bg-transparent focus:outline-none"
          >
            <option value="info">ℹ️ Info</option>
            <option value="success">✅ Success</option>
            <option value="warning">⚠️ Warning</option>
            <option value="promo">🎉 Promotion</option>
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label className="text-sm">Title</Label>
          <Input
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-secondary/50"
          />
        </div>

        {/* Message */}
        <div className="space-y-1">
          <Label className="text-sm">Message</Label>
          <Textarea
            placeholder="Write your notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-secondary/50 min-h-[100px]"
          />
        </div>

        {/* Link (optional) */}
        <div className="space-y-1">
          <Label className="text-sm">Link (optional)</Label>
          <Input
            placeholder="/dashboard/wallet or https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="bg-secondary/50"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full gradient-primary text-primary-foreground font-bold"
        >
          {sending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Send Notification</>
          )}
        </Button>
      </div>
    </div>
  );
}
