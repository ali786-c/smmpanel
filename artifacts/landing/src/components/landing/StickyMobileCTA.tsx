import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong p-3 border-t border-border">
      <Link to="/signup" className="block">
        <Button className="w-full gradient-primary text-primary-foreground font-semibold">
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
