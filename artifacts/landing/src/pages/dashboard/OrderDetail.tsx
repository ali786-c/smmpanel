import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ExternalLink, RotateCcw, XCircle, Clock, CheckCircle, AlertCircle, Play, Download } from "lucide-react";
import { format } from "date-fns";

const statusVariant: Record<string, string> = {
  Completed: "bg-primary/20 text-primary border-0",
  "In progress": "bg-info/20 text-info border-0",
  "In Progress": "bg-info/20 text-info border-0",
  Processing: "bg-warning/20 text-warning border-0",
  Pending: "bg-warning/20 text-warning border-0",
  Partial: "bg-warning/20 text-warning border-0",
  Cancelled: "bg-destructive/20 text-destructive border-0",
  Refunded: "bg-destructive/20 text-destructive border-0",
};

const statusIcon: Record<string, any> = {
  Pending: Clock, Processing: Play, "In progress": Loader2, "In Progress": Loader2,
  Completed: CheckCircle, Partial: AlertCircle, Cancelled: XCircle, Refunded: RotateCcw,
};

interface OrderDetail {
  id: string; link: string; quantity: number; remains: number | null;
  start_count: number | null; status: string; cost: number; created_at: string;
  updated_at: string; external_order_id: number | null;
  service?: { name: string; platform: string; refill: boolean; cancel: boolean; rate: number } | null;
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    apiFetch(`/orders/${orderId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { toast.error("Order not found"); navigate("/dashboard/orders"); return; }
        setOrder(d.order ?? d);
        setLoading(false);
      });
  }, [orderId]);

  const handleRefill = async () => {
    if (!order) return;
    setActionLoading(true);
    const res = await apiFetch(`/orders/${order.id}/request-refill`, { method: "POST" });
    if (res.ok) toast.success("Refill request submitted");
    else toast.error("Failed to request refill");
    setActionLoading(false);
  };

  const handleSpeedup = async () => {
    if (!order) return;
    setActionLoading(true);
    const res = await apiFetch(`/orders/${order.id}/request-speedup`, { method: "POST" });
    if (res.ok) toast.success("Speedup request submitted");
    else toast.error("Failed to request speedup");
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!order) return;
    setActionLoading(true);
    const res = await apiFetch(`/orders/${order.id}/request-cancel`, { method: "POST" });
    if (res.ok) { toast.success("Cancel request submitted"); setOrder(o => o ? { ...o, status: "Cancelled" } : o); }
    else toast.error("Failed to cancel order");
    setActionLoading(false);
  };

  const generatePdfInvoice = () => {
    if (!order) return;
    const svc = order.service as any;
    const html = `<!DOCTYPE html><html><head><title>Invoice #${order.id.slice(0,8)}</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}h1{color:#10b981}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #eee;text-align:left}</style>
    </head><body><h1>emazingSM Invoice</h1><p>Order ID: ${order.id}</p><p>Date: ${format(new Date(order.created_at), "PPP")}</p>
    <table><tr><th>Service</th><th>Quantity</th><th>Amount</th></tr>
    <tr><td>${svc?.name ?? "Service"}</td><td>${order.quantity}</td><td>$${Number(order.cost).toFixed(4)}</td></tr></table>
    <p><strong>Total: $${Number(order.cost).toFixed(4)}</strong></p></body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return null;

  const svc = order.service as any;
  const isTerminal = ["Completed", "Cancelled", "Refunded", "Partial"].includes(order.status);
  const StatusIcon = statusIcon[order.status] ?? Clock;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate("/dashboard/orders")} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Button>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-lg">{svc?.name ?? "Order"}</h2>
            <p className="text-xs text-muted-foreground mt-1">ID: {order.id.slice(0, 8)}... · {format(new Date(order.created_at), "PPP")}</p>
          </div>
          <Badge className={statusVariant[order.status] ?? "bg-muted"}>
            <StatusIcon className="w-3 h-3 mr-1" />{order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Platform", value: svc?.platform ?? "—" },
            { label: "Quantity", value: order.quantity.toLocaleString() },
            { label: "Cost", value: `$${Number(order.cost).toFixed(4)}` },
            { label: "Start Count", value: order.start_count?.toLocaleString() ?? "—" },
            { label: "Remains", value: order.remains?.toLocaleString() ?? "—" },
            { label: "Provider Order ID", value: order.external_order_id?.toString() ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Link</p>
          <a href={order.link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1 truncate">
            {order.link} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>

        {!isTerminal && order.quantity > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Delivery Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, ((order.quantity - (order.remains || 0)) / order.quantity) * 100))}%` }} />
              </div>
              <span className="text-xs font-medium text-primary">
                {Math.round(((order.quantity - (order.remains || 0)) / order.quantity) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        {!isTerminal && (
          <Button onClick={handleSpeedup} disabled={actionLoading} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Request Speedup
          </Button>
        )}
        {!isTerminal && svc?.refill && (
          <Button onClick={handleRefill} disabled={actionLoading} className="gap-2 gradient-primary text-primary-foreground">
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Request Refill
          </Button>
        )}
        {!isTerminal && svc?.cancel && (
          <Button variant="outline" onClick={handleCancel} disabled={actionLoading} className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancel Order
          </Button>
        )}
        <Button variant="outline" onClick={generatePdfInvoice} className="gap-2 border-primary/30 hover:bg-primary/10 ml-auto">
          <Download className="w-4 h-4" /> Invoice
        </Button>
      </div>
    </div>
  );
}
