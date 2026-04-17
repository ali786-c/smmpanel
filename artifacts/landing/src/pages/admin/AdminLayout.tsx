import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Layers, TrendingUp, Ticket,
  ArrowLeft, LogOut, Shield, Activity, Menu, X,
  ShoppingCart, FileText, DollarSign as DollarSignIcon, Megaphone,
  Tag, Percent, Wifi, History, Settings, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { apiFetch, getToken } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";

const adminNavItems = [
  { icon: LayoutDashboard,  label: "Overview",       path: "/admin" },
  { icon: ShoppingCart,     label: "Orders",         path: "/admin/orders" },
  { icon: ShoppingCart,     label: "Create Order",   path: "/admin/create-order" },
  { icon: Users,            label: "Users",          path: "/admin/users" },
  { icon: Layers,           label: "Services",       path: "/admin/services" },
  { icon: Percent,          label: "Markup",         path: "/admin/markup" },
  { icon: Tag,              label: "Coupons",        path: "/admin/coupons" },
  { icon: Ticket,           label: "Tickets",        path: "/admin/tickets" },
  { icon: DollarSignIcon,   label: "Finance",        path: "/admin/finance" },
  { icon: DollarSignIcon,   label: "Refunds",        path: "/admin/refunds" },
  { icon: TrendingUp,       label: "Revenue",        path: "/admin/revenue" },
  { icon: Wifi,             label: "Provider Sync",  path: "/admin/provider" },
  { icon: FileText,         label: "Blog",           path: "/admin/blog" },
  { icon: Zap,              label: "AI Automation",  path: "/admin/ai-blogging" },
  { icon: Megaphone,        label: "Announcements",  path: "/admin/announcements" },
  { icon: Megaphone,        label: "Mass Notify",    path: "/admin/mass-notify" },
  { icon: Users,            label: "Affiliates",     path: "/admin/affiliates" },
  { icon: Layers,           label: "Categories",     path: "/admin/categories" },
  { icon: History,          label: "Activity Log",   path: "/admin/activity" },
  { icon: Zap,              label: "Growth Engine",  path: "/admin/growth" },
  { icon: Settings,         label: "Settings",       path: "/admin/settings" },
  { icon: DollarSignIcon,   label: "Payments Setup", path: "/admin/payments" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const isOverview = location.pathname === "/admin";

  useEffect(() => {
    if (!getToken()) { navigate("/login"); return; }
    apiFetch("/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) { navigate("/login"); return; }
        const roles: string[] = d.user.roles ?? [];
        if (!roles.includes("admin")) { navigate("/dashboard"); return; }
        setAdminEmail(d.user.email);
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("esm_token");
    localStorage.removeItem("esm_user");
    navigate("/login");
  };

  const sidebar = (
    <>
      <Link to="/admin" className="flex items-center gap-2 mb-1 px-2">
        <Shield className="w-6 h-6 text-primary" />
        <span className="text-lg font-heading font-bold">
          emazin<span className="text-primary">gSM</span> Admin
        </span>
      </Link>
      <p className="text-xs text-muted-foreground px-2 mb-4">{adminEmail || "Management Console"}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 mt-auto pt-2">
        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar p-4">
        {sidebar}
      </aside>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar border-r border-border p-4 flex flex-col overflow-y-auto">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 glass-strong border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="font-heading font-semibold text-lg">
                {adminNavItems.find((n) => n.path === location.pathname)?.label || "Admin"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-xs glass rounded-lg px-3 py-1.5 text-primary font-medium">
                <Shield className="w-3 h-3 inline mr-1" /> ADMIN
              </span>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          {isOverview ? <AdminOverviewContent /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}

function AdminOverviewContent() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/dashboard").then(r => r.ok ? r.json() : null),
      apiFetch("/admin/dashboard/charts").then(r => r.ok ? r.json() : null),
    ]).then(([dash, ch]) => {
      setStats(dash?.stats ?? dash ?? {});
      setCharts({ ...ch, recent_orders: dash?.recent_orders ?? [] });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Activity className="w-6 h-6 animate-spin text-primary" /></div>;

  const s = stats || {};
  const revenueData = (charts?.daily_revenue ?? []).map((d: any) => ({ ...d, profit: d.profit ?? 0 }));
  const platformData = (charts?.by_platform ?? []).map((d: any) => ({ name: d.platform, value: d.count }));
  const recentOrders = charts?.recent_orders ?? [];

  const statCards = [
    { label: "Total Revenue",    value: `$${parseFloat(s.total_revenue ?? 0).toFixed(2)}`,  icon: DollarSignIcon },
    { label: "Total Profit",     value: `$${parseFloat(s.total_profit ?? 0).toFixed(2)}`,   icon: TrendingUp },
    { label: "Total Users",      value: (s.total_users ?? 0).toLocaleString(),               icon: Users },
    { label: "Total Orders",     value: (s.total_orders ?? 0).toLocaleString(),              icon: ShoppingCart },
    { label: "Active Orders",    value: (s.active_orders ?? 0).toLocaleString(),             icon: Activity },
    { label: "Services",         value: (s.total_services ?? 0).toLocaleString(),            icon: Layers },
    { label: "Open Tickets",     value: (s.pending_tickets ?? 0).toLocaleString(),           icon: Ticket },
  ];

  const COLORS = ["hsl(163,58%,50%)", "hsl(155,100%,75%)", "hsl(210,100%,60%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(270,60%,60%)"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <stat.icon className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            </div>
            <div className="text-lg font-heading font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-heading font-semibold mb-4">Revenue & Profit (Last 14 Days)</h3>
          {revenueData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,30%,20%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(213,20%,55%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(213,20%,55%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(213,50%,12%)", border: "1px solid hsl(213,30%,20%)", borderRadius: 12 }} />
                  <Bar dataKey="revenue" fill="hsl(163,58%,50%)" radius={[4,4,0,0]} name="Revenue" />
                  <Bar dataKey="profit" fill="hsl(155,100%,75%)" radius={[4,4,0,0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-muted-foreground text-sm py-16 text-center">No orders yet — charts appear after first orders</p>}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Services by Platform</h3>
          {platformData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {platformData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(213,50%,12%)", border: "1px solid hsl(213,30%,20%)", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-muted-foreground text-sm py-16 text-center">Sync services to see platform data</p>}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Order ID","User","Service","Cost","Profit","Status","Date"].map(h => (
                  <th key={h} className="text-left pb-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No orders yet</td></tr>
              ) : recentOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-border/30">
                  <td className="py-2.5 font-mono text-xs">{String(o.id).slice(0,8)}…</td>
                  <td className="py-2.5 text-xs">{o.user_email ?? o.user_id?.slice(0,8)}</td>
                  <td className="py-2.5 text-xs truncate max-w-[120px]">{o.service_name ?? "—"}</td>
                  <td className="py-2.5 text-xs font-medium">${parseFloat(o.cost || 0).toFixed(2)}</td>
                  <td className="py-2.5 text-xs text-primary">${parseFloat(o.profit || 0).toFixed(2)}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.status === "Completed" ? "bg-primary/20 text-primary" :
                      o.status === "In progress" ? "bg-blue-500/20 text-blue-400" :
                      o.status === "Cancelled" ? "bg-destructive/20 text-destructive" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>{o.status}</span>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
