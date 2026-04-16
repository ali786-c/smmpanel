import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Plus, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  order_id: string | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: string;
  content: string;
  created_at: string;
}

const statusStyle: Record<string, string> = {
  open: "bg-warning/20 text-warning border-0",
  closed: "bg-primary/20 text-primary border-0",
};

export default function Tickets() {
  const { user } = useAuth();
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
    if (!user) return;
    supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTickets((data as Ticket[]) || []);
        setLoading(false);
      });
  }, [user]);

  const createTicket = async () => {
    if (!user || !newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({ user_id: user.id, subject: newSubject.trim(), category: newCategory })
      .select()
      .single();

    if (error || !ticket) {
      toast.error("Failed to create ticket");
      setCreating(false);
      return;
    }

    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender: "user",
      content: newMessage.trim(),
    });

    setTickets((prev) => [ticket as Ticket, ...prev]);
    setNewSubject("");
    setNewMessage("");
    setShowCreate(false);
    setCreating(false);
    toast.success("Ticket created successfully");
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
      sender: "user",
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
      sender: "user",
      content: replyText.trim(),
      created_at: new Date().toISOString(),
    };
    setTicketMessages((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), newMsg],
    }));
    setReplyText("");
    setReplying(false);
    toast.success("Reply sent");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">Support Tickets</h2>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="gradient-primary text-primary-foreground"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> New Ticket
        </Button>
      </div>

      {/* Create Ticket Form */}
      {showCreate && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <Input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Subject"
            className="bg-secondary/50"
          />
          <div className="flex gap-2">
            {["general", "order", "payment", "account"].map((c) => (
              <button
                key={c}
                onClick={() => setNewCategory(c)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  newCategory === c
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Describe your issue..."
            className="bg-secondary/50 min-h-[80px]"
          />
          <Button
            onClick={createTicket}
            disabled={creating || !newSubject.trim() || !newMessage.trim()}
            className="gradient-primary text-primary-foreground"
            size="sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            Submit Ticket
          </Button>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tickets yet. Create one if you need help!</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => loadMessages(ticket.id)}
              className="w-full p-5 text-left flex items-start justify-between hover:bg-secondary/10 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{ticket.id.slice(0, 8)}</span>
                  <Badge className={statusStyle[ticket.status] || statusStyle.open}>{ticket.status}</Badge>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{ticket.category}</span>
                </div>
                <h3 className="font-heading font-semibold text-sm">{ticket.subject}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</span>
                {expandedTicket === ticket.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded Messages */}
            {expandedTicket === ticket.id && (
              <div className="border-t border-border p-4 space-y-3">
                {(ticketMessages[ticket.id] || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.sender === "user"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary/50"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.sender === "user" ? "You" : "Support"}
                      </p>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {ticket.status === "open" && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      className="bg-secondary/50"
                      onKeyDown={(e) => e.key === "Enter" && sendReply(ticket.id)}
                    />
                    <Button
                      size="icon"
                      onClick={() => sendReply(ticket.id)}
                      disabled={replying || !replyText.trim()}
                      className="gradient-primary text-primary-foreground shrink-0"
                    >
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
