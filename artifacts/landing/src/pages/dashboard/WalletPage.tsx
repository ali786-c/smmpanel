import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2, Info, ArrowRightLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";

interface WalletTransaction {
  id: string;
  type: string;
  payment_method: string | null;
  amount: number;
  created_at: string;
  status: string;
  description: string | null;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [conversionRate, setConversionRate] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/wallet").then(r => r.ok ? r.json() : null),
      apiFetch("/wallet/transactions?per_page=50").then(r => r.ok ? r.json() : null),
      apiFetch("/payment/payhub/rate").then(r => r.ok ? r.json() : null),
    ]).then(([wallet, txData, rateData]) => {
      if (wallet) setBalance(parseFloat(wallet.balance ?? wallet.wallet?.balance ?? 0));
      if (rateData) setConversionRate(rateData.rate);
      const txList = txData?.data ?? txData?.transactions ?? txData ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);
    }).finally(() => setLoading(false));
  }, []);

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
       toast.error("Please enter a valid amount (minimum $1)");
       return;
    }

    setPaymentLoading(true);
    try {
      const response = await apiFetch("/payment/payhub/checkout", {
        method: "POST",
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await response.json();
      if (response.ok && data.checkout_url) {
         window.location.href = data.checkout_url;
      } else {
         toast.error(data.error || "Failed to initiate payment");
      }
    } catch (e) {
      toast.error("An error occurred during payment initiation");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const eurPreview = amount && conversionRate ? (parseFloat(amount) * conversionRate).toFixed(2) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Balance Card */}
      <div className="glass rounded-[2rem] p-10 text-center relative overflow-hidden border-primary/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative">
          <p className="text-sm font-heading text-muted-foreground uppercase tracking-widest mb-2">Available Balance</p>
          <p className="text-6xl font-heading font-bold text-primary mb-2">
            ${balance !== null ? balance.toFixed(2) : "0.00"}
          </p>
          <p className="text-sm text-muted-foreground">Ready for your next upgrade</p>
        </div>
      </div>

      {/* PayHub Deposit Section */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
           <div className="glass rounded-2xl p-8 border border-primary/20 bg-background/50 shadow-xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="w-5 h-5 text-primary" />
                 </div>
                 <h2 className="text-xl font-heading font-semibold">Add Funds via PayHub</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount to Deposit (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">$</span>
                    <Input 
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10 py-7 text-2xl font-bold rounded-xl border-primary/10 focus:ring-primary bg-primary/5"
                    />
                  </div>
                </div>

                {eurPreview && (
                   <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <ArrowRightLeft className="w-4 h-4" />
                         <span>Live Conversion Preview:</span>
                      </div>
                      <span className="text-lg font-bold text-primary">€{eurPreview} EUR</span>
                   </div>
                )}

                <Button 
                  onClick={handleDeposit}
                  disabled={paymentLoading || !amount}
                  className="w-full py-8 text-xl font-heading font-bold rounded-xl gradient-primary shadow-lg hover:scale-[1.01] transition-all group"
                >
                  {paymentLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Pay Securely Now
                      <CreditCard className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
           </div>

           <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Refund Policy:</strong> All deposits are strictly non-refundable. Funds are converted to EUR at the current rate (including a small processing margin) for secure gateway handling.
              </p>
           </div>
        </div>

        {/* Transaction Stats Sidebar */}
        <div className="md:col-span-2 space-y-4">
           <div className="glass rounded-2xl p-6 border border-border/50">
              <h3 className="text-sm font-heading font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
              <div className="space-y-3">
                 <Button variant="outline" className="w-full justify-start rounded-xl font-medium" onClick={() => (window as any).$chatwoot && (window as any).$chatwoot.toggle()}>
                    Customer Support
                 </Button>
                 <Button variant="outline" className="w-full justify-start rounded-xl font-medium" onClick={() => window.open('/terms', '_blank')}>
                    Payment Terms
                 </Button>
              </div>
           </div>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="glass rounded-2xl p-6 overflow-hidden border border-border/50">
        <h3 className="font-heading font-semibold mb-6">Recent Transaction History</h3>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Your transactions history will appear here.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="p-4 font-medium uppercase tracking-tighter text-xs">Type</th>
                  <th className="p-4 font-medium uppercase tracking-tighter text-xs">Gateway</th>
                  <th className="p-4 font-medium uppercase tracking-tighter text-xs">Amount (USD)</th>
                  <th className="p-4 font-medium uppercase tracking-tighter text-xs">Status</th>
                  <th className="p-4 font-medium uppercase tracking-tighter text-xs text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors last:border-0 font-medium">
                      <td className="p-4 capitalize truncate max-w-[120px]">{tx.type}</td>
                      <td className="p-4 text-muted-foreground text-xs">{tx.payment_method || "PayHub"}</td>
                      <td className={`p-4 font-heading font-semibold ${isPositive ? "text-primary" : "text-destructive"}`}>
                        {isPositive ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${tx.status === "completed" || tx.status === "paid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs text-right">
                        {format(new Date(tx.created_at), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
