import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface WalletTransaction {
  id: string;
  type: string;
  payment_method: string | null;
  amount: number;
  created_at: string;
  status: string;
  description: string | null;
}

const paymentMethods = [
  { icon: CreditCard, name: "Card", description: "Credit/Debit Card", min: "$5" },
  { icon: Banknote, name: "PayPal", description: "PayPal Balance", min: "$5" },
  { icon: Banknote, name: "Bank Transfer", description: "Wire / SEPA", min: "$25" },
];

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (walletRes.data) setBalance(walletRes.data.balance);
      if (txRes.data) setTransactions(txRes.data);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="glass rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative">
          <p className="text-sm text-muted-foreground mb-2">Your Balance</p>
          <p className="text-5xl font-heading font-bold text-primary mb-1">
            ${balance !== null ? balance.toFixed(2) : "0.00"}
          </p>
          <p className="text-xs text-muted-foreground">Available for orders</p>
        </div>
      </div>

      {/* No Refund Notice */}
      <div className="glass rounded-2xl p-4 border border-destructive/20 bg-destructive/5">
        <p className="text-xs text-muted-foreground text-center">
          <span className="text-destructive font-semibold">⚠ No Refund Policy:</span> All deposits are final. Due to the digital nature of our services, funds added to your account are <strong>non-refundable</strong>. By adding funds you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
        </p>
      </div>

      {/* Add Funds */}
      <div className="grid md:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <div key={method.name} className="glass rounded-2xl p-5 hover:glow transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <method.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-heading font-semibold">{method.name}</h3>
            <p className="text-xs text-muted-foreground">{method.description}</p>
            <p className="text-xs text-primary mt-2">Min: {method.min}</p>
            <Button className="w-full mt-3 gradient-primary text-primary-foreground text-sm" size="sm">
              Add Funds
            </Button>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 capitalize">{tx.type}</td>
                      <td className="py-3 text-muted-foreground">{tx.payment_method || "—"}</td>
                      <td className={`py-3 font-heading font-semibold ${isPositive ? "text-primary" : "text-destructive"}`}>
                        {isPositive ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {format(new Date(tx.created_at), "MMM d, yyyy")}
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
