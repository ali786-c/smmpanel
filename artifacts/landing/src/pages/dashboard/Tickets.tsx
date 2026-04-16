import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Plus, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface Ticket { id: string; subject: string; category: string; status: string; created_at: string; order_id: string | null; }
interface TicketMessage { id: string; ticket_id: string; sender: string; content: string; created_at: string; }

const statusStyle: Record<string, string> = {
  open: "bg-warning/20 text-warning border-0",
  closed: "bg-primary/20 text-primary border-0",
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [creating, setCreating] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    apiFetch("/tickets?per_page=50")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setTickets(d?.data ?? d?.tickets ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const createTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    const res = await apiFetch("/tickets", {
      method: "POST",
      body: JSON.stringify({ subject: newSubject.trim(), category: newCategory, message: newMessage.trim() }),
    });
    if (!res.ok) { toast.error("Failed to create ticket"); setCreating(false); return; }
    const ticket = await res.json();
    setTickets(prev => [ticket.ticket ?? ticket, ...prev]);
    setNewSubject(""); setNewMessage(""); setShowCreate(false);
    setCreating(false);
    toast.success("Ticket created successfully");
  };

  const loadMessages = async (ticketId: string) => {
    if (expandedTicket === ticketId) { setExpandedTicket(null); return; }
    const res = await apiFetch(`/tickets/${ticketId}`);
    if (res.ok) {
      const d = await res.json();
      setTicketMessages(prev => ({ ...prev, [ticketId]: d.messages ?? [] }));
    }
    setExpandedTicket(ticketId);
  };

  const sendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    const res = await apiFetch(`/tickets/${ticketId}/reply`, {
      method: "POST",
      body: JSON.stringify({ content: replyText.trim() }),
    });
    if (!res.ok) { toast.error("Failed to send reply"); setReplying(false); return; }
    const newMsg: TicketMessage = {
      id: crypto.randomUUID(), ticket_id: ticketId, sender: "user",
      content: replyText.trim(), created_at: new Date().toISOString(),
    };
    setTicketMessages(prev => ({ ...prev, [ticketId]: [...(prev[ticketId] || []), newMsg] }));
    setReplyText(""); setReplying(false);
    toast.success("Reply sent");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Support Tickets</h2>
        <Button onClick={() => setShowCreate(!showCreate)} className="gradient-primary text-primary-foreground gap-2" size="sm">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {showCreate && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-heading font-semibold">Create New Ticket</h3>
          <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Subject" className="bg-secondary/50" />
          <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full rounded-lg bg-secondary/50 border border-border px-3 py-2 text-sm">
            <option value="general">General</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="order">Order Issue</option>
          </select>
          <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Describe your issue..." className="bg-secondary/50 min-h-[100px]" />
          <div className="flex gap-2">
            <Button onClick={createTicket} disabled={creating || !newSubject.trim() || !newMessage.trim()} className="gradient-primary text-primary-foreground">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit Ticket
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tickets yet. Need help? Open a new ticket.</p>
        </div>
      ) : (
        tickets.map(ticket => (
          <div key={ticket.id} className="glass rounded-2xl overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors text-left" onClick={() => loadMessages(ticket.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <Badge className={statusStyle[ticket.status] ?? "bg-muted"}>{ticket.status}</Badge>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.category} · {format(new Date(ticket.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
              {expandedTicket === ticket.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            {expandedTicket === ticket.id && (
              <div className="border-t border-border p-4 space-y-3">
                {(ticketMessages[ticket.id] || []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.sender === "user" ? "gradient-primary text-primary-foreground" : "bg-secondary/50"}`}>
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.sender === "user" ? "You" : "Support"}</p>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {ticket.status === "open" && (
                  <div className="flex gap-2 mt-2">
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..." className="bg-secondary/50" onKeyDown={e => e.key === "Enter" && sendReply(ticket.id)} />
                    <Button size="icon" onClick={() => sendReply(ticket.id)} disabled={replying || !replyText.trim()} className="gradient-primary text-primary-foreground shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
