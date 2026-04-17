import { Button } from "@/components/ui/button";
import { XCircle, RefreshCcw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto py-20 text-center space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
        <XCircle className="w-24 h-24 text-destructive mx-auto relative z-10" />
      </div>

      <div className="space-y-4 relative z-10">
        <h1 className="text-4xl font-heading font-bold text-destructive">Payment Cancelled</h1>
        <p className="text-muted-foreground">
          It looks like you cancelled the payment process. No funds have been deducted from your account.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 pt-8">
        <Button onClick={() => navigate("/dashboard/wallet")} className="gradient-primary py-6 px-10 rounded-2xl flex items-center gap-2">
          <RefreshCcw className="w-5 h-5" />
          Try Again
        </Button>
        <Button onClick={() => navigate("/dashboard")} variant="outline" className="py-6 px-10 rounded-2xl border-destructive/20 flex items-center gap-2">
          <Home className="w-5 h-5" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
