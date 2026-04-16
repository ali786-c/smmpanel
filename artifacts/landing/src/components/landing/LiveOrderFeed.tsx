import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface FakeOrder {
  id: string;
  service: string;
  status: "Completed" | "Processing";
  time: string;
}

// Stripe-compliant marketing terminology — no fake engagement metrics
const compliантServices = [
  "Instagram Growth Campaign",
  "YouTube Channel Promotion",
  "TikTok Brand Awareness",
  "Twitter Audience Campaign",
  "Facebook Page Promotion",
  "Telegram Community Growth",
  "Instagram Content Strategy",
  "YouTube SEO Optimization",
  "TikTok Creator Campaign",
  "Social Media Audit",
  "Cross-Platform Strategy",
  "Influencer Outreach Campaign",
  "Content Distribution Plan",
  "Brand Visibility Package",
  "Engagement Strategy Review",
  "Audience Research Report",
  "Social Analytics Setup",
  "Campaign Performance Review",
];

function generateOrder(): FakeOrder {
  const service = compliантServices[Math.floor(Math.random() * compliантServices.length)];
  const isCompleted = Math.random() > 0.3;
  const mins = Math.floor(Math.random() * 55) + 1;
  return {
    id: Math.random().toString(36).slice(2, 8),
    service,
    status: isCompleted ? "Completed" : "Processing",
    time: `${mins}m ago`,
  };
}

export default function LiveOrderFeed() {
  const [orders, setOrders] = useState<FakeOrder[]>(() =>
    Array.from({ length: 5 }, generateOrder)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => [generateOrder(), ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-2xl p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-xs font-heading font-semibold text-foreground">Live Campaigns</span>
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2 min-w-0">
              {order.status === "Completed" ? (
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-warning animate-spin shrink-0" />
              )}
              <span className="text-muted-foreground truncate">{order.service}</span>
            </div>
            <span className="text-muted-foreground shrink-0 ml-2">{order.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
