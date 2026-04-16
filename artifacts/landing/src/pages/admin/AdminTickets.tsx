import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MessageSquare, CheckCircle, Clock, Send, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  pending: "bg-blue-500/20 text-blue-400",
  closed: "bg-secondary text-muted-foreground",
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ per_page: "50" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await apiFetch(`/admin/tickets?${params}`);
    if (res.ok) { const d = await res.json(); setTickets(d.data ?? d.tickets ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const expand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setTicketDetail(null); return; }
    setExpandedId(id);
    const res = await apiFetch(`/admin/tickets/${id}`);
    if (res.ok) { const d = await res.json(); setTicketDetail(d.ticket ?? d); }
  };

  const handleReply = async () => {
    if (!expandedId || !reply.trim()) return;
    setReplying(true);
    const res = await apiFetch(`/admin/tickets/${expandedId}/reply`, { method: "POST", body: JSON.stringify({ message: reply }) });
    if (res.ok) { toast.success("Reply sent"); setReply(""); expand(expandedId); load(); }
    else toast.error("Reply failed");
    setReplying(false);
  };

  const handleStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/admin/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (res.ok) { toast.success(`Ticket ${status}`); load(); if (expandedId === id) { const r = await apiFetch(`/admin/tickets/${id}`); if (r.ok) setTicketDetail((await r.json()).ticket ?? null); } }
    else toast.error("Update failed");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ticket?")) return;
    const res = await apiFetch(`/admin/tickets/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); if (expandedId === id) { setExpandedId(null); setTicketDetail(null); } load(); }
    else toast.error("Delete failed");
  };

  const filtered = statusFilter === "all" ? tickets : tickets.filter(t => t.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Support Tickets <span className="text-muted-foreground text-sm font-normal">({filtered.length})</span>
        </h2>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-border bg-background text-sm px-3 text-foreground">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No tickets</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20" onClick={() => expand(t.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{t.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? "bg-secondary text-muted-foreground"}`}>{t.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.user_email ?? t.user?.email ?? "User"} · {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.status !== "closed" && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" onClick={e => { e.stopPropagation(); handleStatus(t.id, "closed"); }}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Close
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={e => { e.stopPropagation(); handleDelete(t.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {expandedId === t.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === t.id && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                  {ticketDetail ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {(ticketDetail.messages ?? ticketDetail.replies ?? []).map((m: any, i: number) => (
                        <div key={i} className={`rounded-xl p-3 text-sm ${m.is_admin || m.sender_role === "admin" ? "bg-primary/10 ml-6" : "bg-secondary/40 mr-6"}`}>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{m.is_admin || m.sender_role === "admin" ? "Admin" : "User"} · {new Date(m.created_at).toLocaleString()}</p>
                          <p>{m.message ?? m.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}

                  {t.status !== "closed" && (
                    <div className="flex gap-2 mt-2">
                      <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type reply…" className="flex-1 text-sm resize-none h-20" />
                      <Button onClick={handleReply} disabled={replying || !reply.trim()} className="gradient-primary text-primary-foreground h-20 px-4">
                        {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
