import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Gift } from "lucide-react";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("exit_popup_dismissed");
    if (dismissed) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        document.removeEventListener("mouseout", handler);
      }
    };

    // Delay registration to avoid triggering on page load
    const timeout = setTimeout(() => {
      document.addEventListener("mouseout", handler);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mouseout", handler);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("exit_popup_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70" onClick={dismiss}>
      <div
        className="glass-strong rounded-2xl p-8 max-w-sm mx-4 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Gift className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-heading font-bold mb-2">Wait! Get a Free Bonus</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Sign up now and get bonus campaign credits on your first deposit. Limited time offer.
        </p>
        <Link to="/signup" onClick={dismiss}>
          <Button className="w-full gradient-primary text-primary-foreground font-semibold">
            Claim Free Bonus
          </Button>
        </Link>
        <button onClick={dismiss} className="text-xs text-muted-foreground mt-3 block mx-auto hover:underline">
          No thanks, I'll pass
        </button>
      </div>
    </div>
  );
}
