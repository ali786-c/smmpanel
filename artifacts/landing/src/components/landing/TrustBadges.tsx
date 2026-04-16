import { Shield, Lock, CreditCard } from "lucide-react";

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5 text-primary" />
        <span>256-bit SSL</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CreditCard className="w-3.5 h-3.5 text-primary" />
        <span>Stripe</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CreditCard className="w-3.5 h-3.5 text-primary" />
        <span>PayPal</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CreditCard className="w-3.5 h-3.5 text-primary" />
        <span>Multi-Currency</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>GDPR</span>
      </div>
    </div>
  );
}
