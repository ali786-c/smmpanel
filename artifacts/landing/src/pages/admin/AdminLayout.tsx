import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Layers, TrendingUp, Ticket,
  ArrowLeft, LogOut, Shield, Activity, Menu, X,
  ShoppingCart, FileText, DollarSign as DollarSignIcon, Megaphone,
  Tag, Percent, Wifi, History, Settings, Zap, Palette, Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
  { icon: ShoppingCart, label: "Create Order", path: "/admin/create-order" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Layers, label: "Services", path: "/admin/services" },
  { icon: Percent, label: "Markup", path: "/admin/markup" },
  { icon: Tag, label: "Coupons", path: "/admin/coupons" },
  { icon: Ticket, label: "Tickets", path: "/admin/tickets" },
  { icon: DollarSignIcon, label: "Finance", path: "/admin/finance" },
  { icon: DollarSignIcon, label: "Refunds", path: "/admin/refunds" },
  { icon: TrendingUp, label: "Revenue", path: "/admin/revenue" },
  { icon: Wifi, label: "Provider", path: "/admin/provider" },
  { icon: FileText, label: "Blog", path: "/admin/blog" },
  { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
  { icon: Megaphone, label: "Mass Notify", path: "/admin/mass-notify" },
  { icon: Users, label: "Affiliates", path: "/admin/affiliates" },
  { icon: Layers, label: "Categories", path: "/admin/categories" },
  { icon: History, label: "Activity Log", path: "/admin/activity" },
  { icon: Zap, label: "Growth Engine", path: "/admin/growth" },
  { icon: Palette, label: "Theme Editor", path: "/admin/theme" },
  { icon: Layout, label: "Landing Page", path: "/admin/landing" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOverview = location.pathname === "/admin";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const sidebar = (
    <>
      <Link to="/admin" className="flex items-center gap-2 mb-2 px-2">
        <Shield className="w-6 h-6 text-primary" />
        <span className="text-lg font-heading font-bold">
          emazin<span className="text-primary">gSM</span> Admin
        </span>
      </Link>
      <p className="text-xs text-muted-foreground px-2 mb-6">Management Console</p>

      <nav className="flex-1 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 mt-auto">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar p-4">
        {sidebar}
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar border-r border-border p-4 flex flex-col">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
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
                <Shield className="w-3 h-3 inline mr-1" />
                ADMIN
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

// Inline overview to avoid circular imports
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

function AdminOverviewContent() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    activeOrders: 0,
    totalServices: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, ordersRes, activeOrdersRes, servicesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("orders").select("id, cost, profit, created_at, status, link"),
        supabase.from("orders").select("id", { count: "exact" }).in("status", ["Processing", "In Progress", "Pending"]),
        supabase.from("services").select("id, platform, is_active", { count: "exact" }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o: any) => sum + parseFloat(String(o.cost || 0)), 0);
      const totalProfit = orders.reduce((sum, o: any) => sum + parseFloat(String(o.profit || 0)), 0);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        totalProfit,
        activeOrders: activeOrdersRes.count || 0,
        totalServices: servicesRes.count || 0,
      });

      // Revenue by day (last 30 days)
      const dailyRevenue: Record<string, { revenue: number; profit: number; orders: number }> = {};
      orders.forEach((o: any) => {
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        if (!dailyRevenue[day]) dailyRevenue[day] = { revenue: 0, profit: 0, orders: 0 };
        dailyRevenue[day].revenue += parseFloat(String(o.cost || 0));
        dailyRevenue[day].profit += parseFloat(String(o.profit || 0));
        dailyRevenue[day].orders += 1;
      });
      const sortedDays = Object.entries(dailyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
          ...data,
        }));
      setRevenueData(sortedDays);

      // Platform distribution
      const platforms: Record<string, number> = {};
      (servicesRes.data || []).forEach((s: any) => {
        platforms[s.platform] = (platforms[s.platform] || 0) + 1;
      });
      setPlatformData(
        Object.entries(platforms)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }))
      );

      // Recent orders
      setRecentOrders(orders.slice(-10).reverse());
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Activity className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ["hsl(163,58%,50%)", "hsl(155,100%,75%)", "hsl(210,100%,60%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(270,60%,60%)"];

  const statCards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSignIcon, sub: "All time" },
    { label: "Total Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp, sub: `${stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}% margin` },
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, sub: "Registered" },
    { label: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, sub: `${stats.activeOrders} active` },
    { label: "Services", value: stats.totalServices.toLocaleString(), icon: Layers, sub: "Available" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5 hover:glow transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-xl font-heading font-bold">{stat.value}</div>
            <div className="text-xs text-primary mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-heading font-semibold mb-4">Revenue & Profit (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,30%,20%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(213,20%,55%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(213,20%,55%)" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(213,50%,12%)", border: "1px solid hsl(213,30%,20%)", borderRadius: 12 }}
                  labelStyle={{ color: "hsl(160,100%,95%)" }}
                />
                <Bar dataKey="revenue" fill="hsl(163,58%,50%)" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="hsl(155,100%,75%)" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Services by Platform</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(213,50%,12%)", border: "1px solid hsl(213,30%,20%)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Order ID</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Link</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Cost</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Profit</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No orders yet</td>
                </tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/30">
                    <td className="py-2.5 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-2.5 text-xs truncate max-w-[200px]">{order.link}</td>
                    <td className="py-2.5 text-xs font-medium">${parseFloat(String(order.cost)).toFixed(2)}</td>
                    <td className="py-2.5 text-xs text-primary">${parseFloat(String(order.profit || 0)).toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "Completed" ? "bg-primary/20 text-primary" :
                        order.status === "Processing" ? "bg-info/20 text-info" :
                        order.status === "Cancelled" ? "bg-destructive/20 text-destructive" :
                        "bg-warning/20 text-warning"
                      }`}>{order.status}</span>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
