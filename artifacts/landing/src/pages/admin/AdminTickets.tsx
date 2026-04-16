import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare, CheckCircle, Clock, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TicketRow {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  order_id: string | null;
  userName?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: string;
  content: string;
  created_at: string;
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [ticketsRes, profilesRes] = await Promise.all([
        supabase.from("tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, display_name"),
      ]);

      const nameMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.display_name]));
      const rows = (ticketsRes.data || []).map((t: any) => ({
        ...t,
        userName: nameMap.get(t.user_id) || "Unknown",
      }));
      setTickets(rows);
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("tickets").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update ticket");
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    toast.success(`Ticket marked as ${newStatus}`);
  };

  const loadMessages = async (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setTicketMessages((prev) => ({ ...prev, [ticketId]: (data as TicketMessage[]) || [] }));
    setExpandedTicket(ticketId);
  };

  const sendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender: "admin",
      content: replyText.trim(),
    });
    if (error) {
      toast.error("Failed to send reply");
      setReplying(false);
      return;
    }
    const newMsg: TicketMessage = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      sender: "admin",
      content: replyText.trim(),
      created_at: new Date().toISOString(),
    };
    setTicketMessages((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), newMsg],
    }));
    setReplyText("");
    setReplying(false);
    toast.success("Reply sent to user");
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.subject.toLowerCase().includes(q) || (t.userName?.toLowerCase() || "").includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCnt = tickets.filter((t) => t.status === "open").length;
  const closedCnt = tickets.filter((t) => t.status === "closed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <MessageSquare className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-heading font-bold">{tickets.length}</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-xl font-heading font-bold text-warning">{openCnt}</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <CheckCircle className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Closed</p>
          <p className="text-xl font-heading font-bold text-primary">{closedCnt}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets..."
          className="bg-secondary/50 flex-1"
        />
        <div className="flex gap-2">
          {["all", "open", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? "gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No tickets found</div>
        ) : (
          filtered.map((ticket) => (
            <div key={ticket.id} className="glass rounded-2xl overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button onClick={() => loadMessages(ticket.id)} className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{ticket.id.slice(0, 8)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.status === "open" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                    }`}>{ticket.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{ticket.category}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.userName} • {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  {ticket.status === "open" ? (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(ticket.id, "closed")} className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Close
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(ticket.id, "open")} className="text-xs">
                      <Clock className="w-3 h-3 mr-1" /> Reopen
                    </Button>
                  )}
                  <button onClick={() => loadMessages(ticket.id)}>
                    {expandedTicket === ticket.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Messages Thread */}
              {expandedTicket === ticket.id && (
                <div className="border-t border-border p-4 space-y-3">
                  {(ticketMessages[ticket.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                  ) : (
                    (ticketMessages[ticket.id] || []).map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            msg.sender === "admin"
                              ? "gradient-primary text-primary-foreground"
                              : "bg-secondary/50"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {msg.sender === "admin" ? "Admin" : "User"} • {new Date(msg.created_at).toLocaleString()}
                          </p>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Admin Reply */}
                  <div className="flex gap-2 mt-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply to user..."
                      className="bg-secondary/50 min-h-[60px]"
                    />
                    <Button
                      size="icon"
                      onClick={() => sendReply(ticket.id)}
                      disabled={replying || !replyText.trim()}
                      className="gradient-primary text-primary-foreground shrink-0 self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
