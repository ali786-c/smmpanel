import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, ExternalLink, RotateCcw, XCircle,
  Clock, CheckCircle, AlertCircle, Play, FileText, Download
} from "lucide-react";
import { format } from "date-fns";

const statusSteps = ["Pending", "Processing", "In Progress", "Completed"];

const statusVariant: Record<string, string> = {
  Completed: "bg-primary/20 text-primary border-0",
  "In Progress": "bg-info/20 text-info border-0",
  Processing: "bg-warning/20 text-warning border-0",
  Pending: "bg-warning/20 text-warning border-0",
  Partial: "bg-warning/20 text-warning border-0",
  Cancelled: "bg-destructive/20 text-destructive border-0",
  Refunded: "bg-destructive/20 text-destructive border-0",
};

const statusIcon: Record<string, any> = {
  Pending: Clock,
  Processing: Play,
  "In Progress": Loader2,
  Completed: CheckCircle,
  Partial: AlertCircle,
  Cancelled: XCircle,
  Refunded: RotateCcw,
};

interface OrderDetail {
  id: string;
  link: string;
  quantity: number;
  remains: number | null;
  start_count: number | null;
  status: string;
  cost: number;
  created_at: string;
  updated_at: string;
  external_order_id: number | null;
  service_id: string | null;
  services?: { name: string; platform: string; refill: boolean; cancel: boolean; rate: number } | null;
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || !orderId) return;
    supabase
      .from("orders")
      .select("*, services(name, platform, refill, cancel, rate)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Order not found");
          navigate("/dashboard/orders");
          return;
        }
        setOrder(data as any);
        setLoading(false);
      });
  }, [user, orderId]);

  // Realtime subscription for order updates
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder((prev) => (prev ? { ...prev, ...payload.new } : prev));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const handleRefill = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke("provider-proxy", {
        body: { action: "refill", orderId: order.external_order_id },
      });
      if (error) throw error;
      toast.success("Refill request submitted");
    } catch {
      toast.error("Failed to request refill");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke("provider-proxy", {
        body: { action: "cancel", orderId: order.external_order_id },
      });
      if (error) throw error;
      toast.success("Cancel request submitted");
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const generatePdfInvoice = () => {
    if (!order) return;
    const svc = order.services as any;
    // Generate a proper HTML invoice and print to PDF
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${order.id.slice(0, 8)}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a2e; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 24px; font-weight: 800; }
  .logo span { color: #10b981; }
  .badge { background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  h2 { color: #10b981; font-size: 18px; margin: 24px 0 12px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { text-align: left; padding: 10px 12px; font-size: 14px; }
  th { background: #f0fdf4; color: #065f46; font-weight: 600; border-bottom: 2px solid #d1fae5; }
  td { border-bottom: 1px solid #e5e7eb; }
  .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #10b981; background: #f0fdf4; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
  .meta-item { font-size: 13px; }
  .meta-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="header">
  <div class="logo">SMM<span>Panel</span></div>
  <div class="badge">${order.status}</div>
</div>
<div class="meta">
  <div class="meta-item"><div class="meta-label">Invoice Number</div><strong>#${order.id.slice(0, 8).toUpperCase()}</strong></div>
  <div class="meta-item"><div class="meta-label">Date</div><strong>${format(new Date(order.created_at), "PPpp")}</strong></div>
  <div class="meta-item"><div class="meta-label">External ID</div><strong>${order.external_order_id || "N/A"}</strong></div>
  <div class="meta-item"><div class="meta-label">Last Updated</div><strong>${format(new Date(order.updated_at), "PPpp")}</strong></div>
</div>
<h2>Service Details</h2>
<table>
  <tr><th>Description</th><th>Details</th></tr>
  <tr><td>Service</td><td>${svc?.name || "N/A"}</td></tr>
  <tr><td>Platform</td><td>${svc?.platform || "N/A"}</td></tr>
  <tr><td>Target Link</td><td style="word-break:break-all">${order.link}</td></tr>
  <tr><td>Quantity</td><td>${order.quantity.toLocaleString()}</td></tr>
  <tr><td>Rate</td><td>$${svc?.rate?.toFixed(4) || "0"} / 1,000</td></tr>
</table>
<h2>Payment Summary</h2>
<table>
  <tr><th>Item</th><th style="text-align:right">Amount</th></tr>
  <tr><td>Service charge (${order.quantity.toLocaleString()} × $${svc?.rate?.toFixed(4) || "0"}/1K)</td><td style="text-align:right">$${Number(order.cost).toFixed(4)}</td></tr>
  <tr class="total-row"><td>Total Charged</td><td style="text-align:right;color:#10b981">$${Number(order.cost).toFixed(4)}</td></tr>
</table>
<div class="footer">
  <p>Thank you for your business!</p>
  <p>This is a computer-generated invoice. No signature required.</p>
</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
    toast.success("Invoice opened — use Print → Save as PDF");
  };

  const generateReceipt = () => {
    if (!order) return;
    const svc = order.services as any;
    const lines = [
      "═══════════════════════════════════",
      "           INVOICE / RECEIPT",
      "═══════════════════════════════════",
      "",
      `Order ID:      ${order.id}`,
      `Date:          ${format(new Date(order.created_at), "PPpp")}`,
      `Status:        ${order.status}`,
      "",
      "───────────────────────────────────",
      "SERVICE DETAILS",
      "───────────────────────────────────",
      `Service:       ${svc?.name || "N/A"}`,
      `Platform:      ${svc?.platform || "N/A"}`,
      `Link:          ${order.link}`,
      `Quantity:      ${order.quantity.toLocaleString()}`,
      `Rate:          $${svc?.rate?.toFixed(4) || "0"} / 1K`,
      "",
      "───────────────────────────────────",
      "PAYMENT",
      "───────────────────────────────────",
      `Total Charged: $${Number(order.cost).toFixed(4)}`,
      "",
      "═══════════════════════════════════",
      "         Thank you for your order!",
      "═══════════════════════════════════",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${order.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  const svc = order.services as any;
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isTerminal = ["Completed", "Partial", "Cancelled", "Refunded"].includes(order.status);
  const progress = isTerminal && order.status === "Completed"
    ? 100
    : isTerminal
    ? currentStepIndex >= 0 ? ((currentStepIndex + 1) / statusSteps.length) * 100 : 50
    : currentStepIndex >= 0
    ? ((currentStepIndex + 0.5) / statusSteps.length) * 100
    : 0;

  const Icon = statusIcon[order.status] || Clock;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/dashboard/orders")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generatePdfInvoice} className="gap-2">
            <FileText className="w-3.5 h-3.5" /> PDF Invoice
          </Button>
          <Button variant="outline" size="sm" onClick={generateReceipt} className="gap-2">
            <Download className="w-3.5 h-3.5" /> TXT Receipt
          </Button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-xl mb-1">Order #{order.id.slice(0, 8)}</h2>
            <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), "PPpp")}</p>
          </div>
          <Badge className={`text-sm px-3 py-1 ${statusVariant[order.status] || ""}`}>
            <Icon className={`w-3.5 h-3.5 mr-1.5 ${order.status === "In Progress" ? "animate-spin" : ""}`} />
            {order.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex || (isTerminal && order.status === "Completed");
              const isCurrent = step === order.status;
              return (
                <div key={step} className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"} ${isCurrent ? "font-bold" : ""}`}>
                  {step}
                </div>
              );
            })}
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Service</p>
            <p className="text-sm font-medium truncate">{svc?.name || "N/A"}</p>
          </div>
          <div className="glass rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="text-sm font-medium">{svc?.platform || "N/A"}</p>
          </div>
          <div className="glass rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="text-sm font-medium">{order.quantity.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-sm font-heading font-bold text-primary">${Number(order.cost).toFixed(4)}</p>
          </div>
        </div>
      </div>

      {/* Link & Tracking */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold">Link & Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Target Link</p>
            <a href={order.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              {order.link} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Start Count</p>
            <p className="text-sm font-medium">{order.start_count ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Remains</p>
            <p className="text-sm font-medium text-primary">{(order.remains || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="text-sm text-muted-foreground">{format(new Date(order.updated_at), "PPpp")}</p>
          </div>
        </div>

        {/* Live Progress */}
        {!isTerminal && order.quantity > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Delivery Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, ((order.quantity - (order.remains || 0)) / order.quantity) * 100))}%` }}
                />
              </div>
              <span className="text-xs font-medium text-primary">
                {Math.round(((order.quantity - (order.remains || 0)) / order.quantity) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isTerminal && (
        <div className="flex gap-3">
          {svc?.refill && (
            <Button
              onClick={handleRefill}
              disabled={actionLoading}
              className="gap-2 gradient-primary text-primary-foreground"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Request Refill
            </Button>
          )}
          {svc?.cancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel Order
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
