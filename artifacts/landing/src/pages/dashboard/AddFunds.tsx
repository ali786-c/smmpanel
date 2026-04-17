import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function AddFunds() {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast.error("Please enter a valid amount (min $1).");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/payment/payhub/checkout", {
        method: "POST",
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        // Redirect to PayHub secure checkout
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || "Failed to initiate payment.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-heading font-bold gradient-text">Add Funds to Wallet</h1>
        <p className="text-muted-foreground">Secure payment via PayHub Gateway</p>
      </div>

      <div className="glass rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <CreditCard className="w-32 h-32" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Amount to Deposit (USD)
            </label>
            <div className="relative max-w-xs mx-auto">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 py-8 text-3xl font-bold text-center rounded-2xl bg-primary/5 border-primary/20 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
             <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Instant Wallet Credit after payment</span>
             </div>
             <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Secure HMAC Encryption</span>
             </div>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={loading || !amount}
            className="w-full py-8 text-xl font-bold rounded-2xl gradient-primary shadow-xl hover:scale-[1.02] transition-transform"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Pay with PayHub"
            )}
          </Button>

          <div className="p-4 bg-muted/50 rounded-xl flex items-center gap-3 text-xs text-muted-foreground text-left">
             <AlertCircle className="w-5 h-5 text-primary" />
             <p>All deposits are final and non-refundable. Funds will be converted to EUR internally for processing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
