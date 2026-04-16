import { useEffect, useState } from "react";
import { Users, ShoppingCart, Layers } from "lucide-react";

interface Stats {
  totalOrders: number;
  activeUsers: number;
  totalServices: number;
}

export default function LiveSocialProof() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 12847, activeUsers: 3200, totalServices: 450 });

  useEffect(() => {
    const domain = (import.meta as any).env?.VITE_REPLIT_DEV_DOMAIN || "";
    const apiBase = domain ? `https://${domain}:8000/api/landing` : "http://localhost:8000/api/landing";
    fetch(`${apiBase}/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data) {
          setStats({
            totalOrders: Math.max(d.data.total_orders?.raw ?? 12847, 12847),
            activeUsers: Math.max(d.data.total_customers?.raw ?? 3200, 3200),
            totalServices: d.data.services?.raw ?? 450,
          });
        }
      })
      .catch(() => {});
  }, []);

  const items = [
    { icon: ShoppingCart, label: "Orders Delivered", value: stats.totalOrders.toLocaleString() },
    { icon: Users, label: "Active Users", value: stats.activeUsers.toLocaleString() },
    { icon: Layers, label: "Services Available", value: stats.totalServices.toLocaleString() },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <item.icon className="w-4 h-4 text-primary" />
          <span className="font-heading font-bold text-foreground">{item.value}</span>
          <span className="text-muted-foreground text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
