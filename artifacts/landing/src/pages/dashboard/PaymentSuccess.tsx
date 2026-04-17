import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Wallet, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success("Payment successful!");
  }, []);

  return (
    <div className="max-w-xl mx-auto py-20 text-center space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <CheckCircle2 className="w-24 h-24 text-primary mx-auto relative z-10 animate-bounce" />
      </div>

      <div className="space-y-4 relative z-10">
        <h1 className="text-4xl font-heading font-bold gradient-text">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your payment has been received. Your wallet balance will be updated automatically within a few minutes once the gateway confirms the transaction.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 pt-8">
        <Button onClick={() => navigate("/dashboard/wallet")} className="gradient-primary py-6 px-10 rounded-2xl flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          View Wallet
        </Button>
        <Button onClick={() => navigate("/dashboard/new-order")} variant="outline" className="py-6 px-10 rounded-2xl border-primary/20 flex items-center gap-2">
          New Order
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
