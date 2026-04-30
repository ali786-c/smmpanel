import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Plus, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface Ticket { id: string; subject: string; category: string; status: string; created_at: string; order_id: string | null; linked_orders: string[] | null; }
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
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    apiFetch("/tickets?per_page=50")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setTickets(d?.data ?? d?.tickets ?? []); });

    apiFetch("/orders?per_page=20")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setOrders(d?.data ?? d?.orders ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const createTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    const res = await apiFetch("/tickets", {
      method: "POST",
      body: JSON.stringify({ 
        subject: newSubject.trim(), 
        category: newCategory, 
        message: newMessage.trim(),
        order_ids: selectedOrders
      }),
    });
    if (!res.ok) { toast.error("Failed to create ticket"); setCreating(false); return; }
    const ticket = await res.json();
    setTickets(prev => [ticket.ticket ?? ticket, ...prev]);
    setNewSubject(""); setNewMessage(""); setShowCreate(false); setSelectedOrders([]);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subject</label>
              <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. Order not starting" className="bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="general">General Inquiry</option>
                <option value="order">Order Issue</option>
                <option value="billing">Billing/Payment</option>
                <option value="technical">Technical Support</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Linked Orders ({selectedOrders.length} selected)</label>
            <div className="glass bg-secondary/30 rounded-xl border border-border/50 max-h-48 overflow-y-auto p-2 space-y-1">
                {orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent orders found</p>
                ) : orders.map(o => (
                    <label key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors border border-transparent hover:border-border/30">
                        <input 
                            type="checkbox" 
                            checked={selectedOrders.includes(o.id)}
                            onChange={(e) => {
                                if (e.target.checked) setSelectedOrders(prev => [...prev, o.id]);
                                else setSelectedOrders(prev => prev.filter(id => id !== o.id));
                            }}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">#{String(o.id).slice(0,8)}... — {o.service?.name || "Order"}</p>
                            <p className="text-[10px] text-muted-foreground">${o.cost} · {new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                    </label>
                ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message</label>
            <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Explain your issue in detail..." className="bg-secondary/50 min-h-[120px]" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={createTicket} disabled={creating || !newSubject.trim() || !newMessage.trim()} className="gradient-primary text-primary-foreground min-w-[140px]">
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
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all hover:scale-[1.01] ${
                      msg.sender === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "glass bg-white dark:bg-white/10 text-foreground border border-border/50 rounded-tl-none"
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-1 opacity-70">
                        <span className="text-[10px] font-bold uppercase tracking-wider">{msg.sender === "user" ? "You" : "Support Team"}</span>
                        <span className="text-[10px]">{format(new Date(msg.created_at), "HH:mm")}</span>
                      </div>
                      <p className="leading-relaxed">{msg.content}</p>
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
