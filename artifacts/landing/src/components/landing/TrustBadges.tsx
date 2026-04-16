import { Shield, Lock, CreditCard, Bitcoin } from "lucide-react";
import { Link } from "react-router-dom";

export default function TrustBadges() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-4 py-2">
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
          <Bitcoin className="w-3.5 h-3.5 text-primary" />
          <span>Crypto</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>GDPR</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/70 text-center">
        All sales are final — digital services are non-refundable.{" "}
        <Link to="/terms#no-refund" className="underline underline-offset-2 hover:text-primary transition-colors">
          Read our Terms
        </Link>
      </p>
    </div>
  );
}
