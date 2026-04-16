import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ShoppingCart, Package, Wallet, 
  MessageSquare, Ticket, LogOut, Rocket,
  TrendingUp, DollarSign, Activity, PlusCircle, Upload, RefreshCw, List,
  Settings, Code, Gift, Star, Globe, Users, Layers, Menu, X, Shield,
  BarChart3, UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const navItems = [
  { icon: PlusCircle, labelKey: "nav.newOrder", path: "/dashboard/new-order" },
  { icon: Upload, labelKey: "nav.massOrder", path: "/dashboard/mass-order" },
  { icon: Activity, labelKey: "nav.orders", path: "/dashboard/orders" },
  { icon: Wallet, labelKey: "nav.addFunds", path: "/dashboard/wallet" },
  { icon: Ticket, labelKey: "nav.tickets", path: "/dashboard/tickets" },
  { icon: List, labelKey: "nav.services", path: "/dashboard/services" },
  { icon: RefreshCw, labelKey: "nav.updates", path: "/dashboard/updates" },
  { icon: Star, labelKey: "nav.vipUpdates", path: "/dashboard/updates" },
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { icon: Code, labelKey: "nav.api", path: "/dashboard/api" },
  { icon: Gift, labelKey: "nav.affiliates", path: "/dashboard/affiliates" },
  { icon: BarChart3, labelKey: "nav.analytics", path: "/dashboard/analytics" },
  { icon: Settings, labelKey: "nav.settings", path: "/dashboard/settings" },
  { icon: UserX, labelKey: "nav.account", path: "/dashboard/account" },
  { icon: MessageSquare, labelKey: "nav.support", path: "/dashboard/support" },
];

function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: "0.00", totalOrders: 0, activeOrders: 0, totalSpent: "0.00" });
  const [siteStats, setSiteStats] = useState({ totalOrders: 0, totalUsers: 0, totalServices: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [walletRes, ordersRes, activeRes, servicesCountRes, userCountRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
        supabase.from("orders").select("id, cost", { count: "exact" }).eq("user_id", user.id),
        supabase.from("orders").select("id", { count: "exact" }).eq("user_id", user.id).in("status", ["Processing", "In Progress", "Pending"]),
        supabase.from("services").select("id", { count: "exact" }).eq("is_active", true),
        supabase.rpc("get_total_user_count"),
      ]);
      const totalSpent = (ordersRes.data || []).reduce((sum: number, o: any) => sum + parseFloat(String(o.cost)), 0);
      const bal = String(walletRes.data?.balance || "0.00");
      setStats({
        balance: bal,
        totalOrders: ordersRes.count || 0,
        activeOrders: activeRes.count || 0,
        totalSpent: totalSpent.toFixed(2),
      });
      setSiteStats({
        totalOrders: ordersRes.count || 0,
        totalUsers: typeof userCountRes.data === "number" ? userCountRes.data : 0,
        totalServices: servicesCountRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const spentNum = parseFloat(stats.totalSpent);
  const userLevel = spentNum >= 10000 ? "Master" : spentNum >= 5000 ? "VIP" : spentNum >= 2000 ? "Elite" : spentNum >= 500 ? "Frequent" : spentNum >= 100 ? "Junior" : "New";

  const levels = ["New", "Junior", "Frequent", "Elite", "VIP", "Master"];
  const perks = [
    { name: "24/7 Tickets' Support", levels: [true, true, true, true, true, true] },
    { name: "5% Payments Bonus", levels: [true, true, true, true, true, true] },
    { name: "$500 Monthly Lottery", levels: [false, false, true, true, true, true] },
    { name: "Free SMM Panel", levels: [false, false, false, true, true, true] },
    { name: "Custom Services", levels: [false, false, false, false, true, true] },
    { name: "Early Notification on New Services", levels: [false, false, false, false, true, true] },
    { name: "Support Handled by the Admins", levels: [false, false, false, false, false, true] },
  ];

  const nextLevel = levels[levels.indexOf(userLevel) + 1];
  const thresholds = [0, 100, 500, 2000, 5000, 10000];
  const nextThreshold = thresholds[levels.indexOf(userLevel) + 1];
  const amountToNext = nextThreshold ? (nextThreshold - spentNum).toFixed(2) : null;

  return (
    <div className="space-y-6">
      {/* Site Stats + Your Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Site Stats */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-primary mb-4 text-sm uppercase tracking-wider">emazingSM</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" /> Total number of orders on site
              </span>
              <span className="text-sm font-bold text-primary">{siteStats.totalOrders.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Total number of users on site
              </span>
              <span className="text-sm font-bold text-primary">{siteStats.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4" /> Total number of services on site
              </span>
              <span className="text-sm font-bold text-primary">{siteStats.totalServices.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Your Stats */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-primary mb-4 text-sm uppercase tracking-wider">You</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Your balance</span>
              <span className="text-sm font-bold text-primary">${stats.balance}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Your money spent</span>
              <span className="text-sm font-bold">${stats.totalSpent}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Your number of orders</span>
              <span className="text-sm font-bold">{stats.totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Level */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold">
            User level
          </h3>
          <span className="text-xs text-primary font-medium">
            ${stats.totalSpent} SPENT | {userLevel.toUpperCase()} ACCOUNT
          </span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">User points + value in USD</span>
          <span className="text-xs text-primary">{stats.totalSpent} pts</span>
        </div>

        {amountToNext && nextLevel && (
          <div className="mt-3 mb-4 p-3 rounded-xl bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-semibold">Next Level: </span>
              You need to spend <span className="text-primary font-bold">${amountToNext}</span> more to reach the <span className="font-bold">{nextLevel.toUpperCase()}</span> level.
            </p>
          </div>
        )}

        {/* Levels Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 font-medium text-muted-foreground w-1/3">Level</th>
                {levels.map((l) => (
                  <th key={l} className={`pb-3 text-center font-medium ${l === userLevel ? "text-primary" : "text-muted-foreground"}`}>
                    {l.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perks.map((perk) => (
                <tr key={perk.name} className="border-b border-border/30">
                  <td className="py-3.5 font-medium uppercase text-xs">{perk.name}</td>
                  {perk.levels.map((has, i) => (
                    <td key={i} className="py-3.5 text-center">
                      {has ? (
                        <span className={`inline-block w-3 h-3 rounded-full ${levels[i] === userLevel ? "bg-primary shadow-[0_0_8px_rgba(45,212,168,0.5)]" : "bg-muted-foreground/30"}`} />
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mt-5 p-4 rounded-xl bg-secondary/20 space-y-1">
          <p className="text-xs font-semibold text-primary uppercase mb-2">Note</p>
          <p className="text-xs text-muted-foreground">* = You may purchase a VIP status for a month from our services under the VIP section.</p>
          <p className="text-xs text-muted-foreground">** = 5% Bonus on Payments made with Perfect Money, Western Union, Bitcoins, Altcoins or Payoneer.</p>
          <p className="text-xs text-muted-foreground">*** = Each month we will pick 1 random Frequent, Elite, VIP or Master user to win $500 to be used on the panel!</p>
          <p className="text-xs text-muted-foreground">**** = You will get a FREE SMM Panel like ours with a FREE domain as well!</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/new-order">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10">
                <PlusCircle className="w-5 h-5 text-primary" />
                <span className="text-xs">New Campaign</span>
              </Button>
            </Link>
            <Link to="/dashboard/wallet">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-xs">Add Funds</span>
              </Button>
            </Link>
            <Link to="/dashboard/orders">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-xs">My Orders</span>
              </Button>
            </Link>
            <Link to="/dashboard/affiliates">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10">
                <Gift className="w-5 h-5 text-primary" />
                <span className="text-xs">Referral Program</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">AI Support</h3>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 animate-glow-pulse">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Need help? Our AI assistant resolves issues instantly.
            </p>
            <Link to="/dashboard/support">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                Open Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isHome = location.pathname === "/dashboard";
  const [balance, setBalance] = useState("0.00");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setBalance(String(data.balance)); });
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single()
      .then(({ data, error }) => { setIsAdmin(!error && !!data); });
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar p-4">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2">
          <Rocket className="w-6 h-6 text-primary" />
          <span className="text-lg font-heading font-bold">
            emazin<span className="text-primary">gSM</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.labelKey + item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary font-medium bg-primary/5 hover:bg-primary/10 transition-all mb-2"
          >
            <Shield className="w-4 h-4" />
            {t("nav.adminPanel")}
          </Link>
        )}
        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-destructive mt-auto" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> {t("nav.logout")}
        </Button>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar border-r border-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <Link to="/" className="flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                <span className="text-lg font-heading font-bold">
                  emazin<span className="text-primary">gSM</span>
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.labelKey + item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary font-medium bg-primary/5 hover:bg-primary/10 transition-all mb-2"
              >
              <Shield className="w-4 h-4" />
              {t("nav.adminPanel")}
            </Link>
            )}
            <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-destructive mt-auto" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> {t("nav.logout")}
            </Button>
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
                {t(navItems.find((n) => n.path === location.pathname)?.labelKey || "nav.dashboard")}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher className="hidden sm:block" />
              <ThemeToggle />
              <div className="glass rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                <span className="text-muted-foreground hidden sm:inline">{t("dashboard.balance")}: </span>
                <span className="font-heading font-bold text-primary">${balance}</span>
              </div>
              <NotificationBell />
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {isHome ? <DashboardHome /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}
