import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Rocket, LogOut, Shield, Users, ShoppingCart, DollarSign,
  AlertTriangle, Settings, BarChart3, Ticket, Activity,
  TrendingUp, ChevronRight, Package, RefreshCw, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

interface AdminStats {
  total_users: number;
  total_orders: number;
  total_revenue: string;
  pending_tickets: number;
  active_orders: number;
  flagged_users: number;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!getToken()) { navigate("/login"); return; }

    // Verify admin access
    apiFetch("/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) { navigate("/login"); return; }
        const roles: string[] = d.user.roles ?? [];
        if (!roles.includes("admin")) { setUnauthorized(true); setLoading(false); return; }
        setUserEmail(d.user.email);
        loadStats();
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [dashRes, alertsRes] = await Promise.all([
        apiFetch("/admin/dashboard"),
        apiFetch("/admin/critical-alerts"),
      ]);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setStats(d.stats ?? d);
      }
      if (alertsRes.ok) {
        const a = await alertsRes.json();
        setAlerts(a.data ?? a ?? []);
      }
    } catch {}
    setLoading(false);
  };

  const handleLogout = () => {
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("esm_token");
    localStorage.removeItem("esm_user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Rocket className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-heading font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-sm">You don't have admin privileges.</p>
        <Link to="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
      </div>
    );
  }

  const adminSections = [
    { icon: Users,        label: "Users",           sub: "Manage accounts & bans",  path: "/admin/users",    color: "text-blue-500" },
    { icon: ShoppingCart, label: "Orders",          sub: "Monitor all orders",       path: "/admin/orders",   color: "text-green-500" },
    { icon: DollarSign,   label: "Finance",         sub: "Revenue & transactions",   path: "/admin/finance",  color: "text-primary" },
    { icon: Ticket,       label: "Tickets",         sub: "Support queue",            path: "/admin/tickets",  color: "text-yellow-500" },
    { icon: Package,      label: "Services",        sub: "Manage services & prices", path: "/admin/services", color: "text-purple-500" },
    { icon: Activity,     label: "Price Watch",     sub: "Margin protection",        path: "/admin/price-watch", color: "text-orange-500" },
    { icon: Globe,        label: "Sync Provider",   sub: "JustPanel sync",           path: "/admin/sync",     color: "text-cyan-500" },
    { icon: Shield,       label: "Security",        sub: "Threats & bans log",       path: "/admin/security", color: "text-red-500" },
    { icon: TrendingUp,   label: "Growth",          sub: "Automation & campaigns",   path: "/admin/growth",   color: "text-pink-500" },
    { icon: BarChart3,    label: "Analytics",       sub: "Revenue & traffic",        path: "/admin/analytics",color: "text-indigo-500" },
    { icon: Settings,     label: "Settings",        sub: "Platform configuration",   path: "/admin/settings", color: "text-muted-foreground" },
    { icon: RefreshCw,    label: "Payment Setup",   sub: "Stripe, PayPal, Crypto",   path: "/admin/payments", color: "text-emerald-500" },
  ];

  const urgentAlerts = Array.isArray(alerts) ? alerts.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass-strong border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold text-sm">emazin<span className="text-primary">gSM</span></span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{userEmail}</span>
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="text-xs">User Panel</Button>
            </Link>
            <ThemeToggle />
            <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1.5 text-xs text-destructive">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Admin Control Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">emazingSM Platform Management</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { label: "Users",         value: stats.total_users,         icon: Users,        color: "text-blue-500" },
              { label: "Orders",        value: stats.total_orders,        icon: ShoppingCart,  color: "text-green-500" },
              { label: "Revenue",       value: `$${stats.total_revenue}`, icon: DollarSign,   color: "text-primary" },
              { label: "Open Tickets",  value: stats.pending_tickets,     icon: Ticket,        color: "text-yellow-500" },
              { label: "Active Orders", value: stats.active_orders,       icon: Activity,     color: "text-purple-500" },
              { label: "Flagged",       value: stats.flagged_users,       icon: AlertTriangle, color: "text-red-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass rounded-xl p-4">
                <Icon className={`w-4 h-4 ${color} mb-2`} />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-heading font-bold">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Critical alerts */}
        {urgentAlerts.length > 0 && (
          <div className="glass rounded-2xl p-5 mb-8 border border-amber-500/30">
            <h2 className="font-heading font-semibold mb-3 flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4" /> Critical Alerts ({urgentAlerts.length})
            </h2>
            <div className="space-y-2">
              {urgentAlerts.map((alert: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{alert.message || alert.type || JSON.stringify(alert)}</span>
                  {alert.severity && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{alert.severity}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin sections grid */}
        <div className="mb-4">
          <h2 className="text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-3">Management Sections</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {adminSections.map(({ icon: Icon, label, sub, path, color }) => (
              <Link
                key={path}
                to={path}
                className="glass rounded-xl p-4 hover:border-primary/30 transition-all group flex flex-col gap-2"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 mt-auto self-end" />
              </Link>
            ))}
          </div>
        </div>

        {/* Dummy credentials notice */}
        <div className="mt-8 glass rounded-xl p-4 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">Test Credentials —</span>{" "}
            Admin: <code className="bg-secondary/50 px-1 rounded">admin@emazingsm.com</code> / <code className="bg-secondary/50 px-1 rounded">Admin1234!</code>{" "}
            · User: <code className="bg-secondary/50 px-1 rounded">user@emazingsm.com</code> / <code className="bg-secondary/50 px-1 rounded">User1234!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
