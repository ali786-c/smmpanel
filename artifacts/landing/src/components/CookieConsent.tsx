import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

// Utility to check if analytics consent is granted
export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem("cookie-consent") === "all";
}

// Call this after consent changes to enable/disable analytics
function applyConsentChoice(type: "all" | "essential" | "rejected") {
  localStorage.setItem("cookie-consent", type);
  
  if (type === "all") {
    // Enable analytics scripts here when integrated
    // e.g., window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    console.log("[Cookies] Analytics consent granted");
  } else {
    // Disable analytics, remove tracking cookies
    // e.g., window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    // Remove any analytics cookies that may have been set
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("_ga") || name.startsWith("_gid") || name.startsWith("_fbp")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    console.log("[Cookies] Analytics consent denied — tracking cookies cleared");
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
    // Apply existing consent on load
    applyConsentChoice(consent as "all" | "essential" | "rejected");
  }, []);

  const accept = (type: "all" | "essential" | "rejected") => {
    applyConsentChoice(type);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 glass rounded-2xl p-5 border border-border shadow-xl animate-in slide-in-from-bottom-4">
      <button onClick={() => accept("essential")} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm mb-1">We use cookies</h4>
          <p className="text-xs text-muted-foreground mb-3">
            We use essential cookies for authentication and optional analytics cookies to improve our platform. 
            Read our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => accept("all")}>
              Accept All
            </Button>
            <Button size="sm" variant="outline" className="text-xs border-border" onClick={() => accept("essential")}>
              Essential Only
            </Button>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => accept("rejected")}>
              Reject All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
