import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Wallet,
  Ticket, LogOut, Rocket,
  Activity, PlusCircle, Upload, RefreshCw, List,
  Settings, Code, Gift, Star, Globe, Users, Layers, Menu, X, Shield,
  BarChart3, UserX, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { apiFetch, getToken } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  roles?: string[];
  profile?: { display_name?: string };
  wallet?: { balance: string | number };
}

const navItems = [
  { icon: PlusCircle,     labelKey: "nav.newOrder",    path: "/dashboard/new-order" },
  { icon: Upload,         labelKey: "nav.massOrder",   path: "/dashboard/mass-order" },
  { icon: Activity,       labelKey: "nav.orders",      path: "/dashboard/orders" },
  { icon: Wallet,         labelKey: "nav.addFunds",    path: "/dashboard/wallet" },
  { icon: Ticket,         labelKey: "nav.tickets",     path: "/dashboard/tickets" },
  { icon: List,           labelKey: "nav.services",    path: "/dashboard/services" },
  { icon: RefreshCw,      labelKey: "nav.updates",     path: "/dashboard/updates" },
  { icon: Star,           labelKey: "nav.vipUpdates",  path: "/dashboard/updates" },
  { icon: LayoutDashboard,labelKey: "nav.dashboard",   path: "/dashboard" },
  { icon: Code,           labelKey: "nav.api",         path: "/dashboard/api" },
  { icon: Gift,           labelKey: "nav.affiliates",  path: "/dashboard/affiliates" },
  { icon: BarChart3,      labelKey: "nav.analytics",   path: "/dashboard/analytics" },
  { icon: Settings,       labelKey: "nav.settings",    path: "/dashboard/settings" },
  { icon: UserX,          labelKey: "nav.account",     path: "/dashboard/account" },
  { icon: MessageSquare,  labelKey: "nav.support",     path: "/dashboard/support" },
];

function DashboardHome({ user }: { user: AuthUser }) {
  const [stats, setStats] = useState({ balance: "0.00", totalOrders: 0, activeOrders: 0, totalSpent: "0.00" });
  const [siteStats, setSiteStats] = useState({ totalOrders: 191000, totalUsers: 0, totalServices: 0 });

  useEffect(() => {
    // Wallet balance
    apiFetch("/wallet").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.balance !== undefined) setStats(s => ({ ...s, balance: parseFloat(d.balance).toFixed(2) }));
    }).catch(() => {});

    // Orders count
    apiFetch("/orders?per_page=1").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.total !== undefined) setStats(s => ({ ...s, totalOrders: d.total }));
    }).catch(() => {});

    // Site stats
    fetch("/api/landing/stats").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.data) setSiteStats({
        totalOrders: d.data.total_orders?.raw ?? 191000,
        totalUsers: d.data.total_customers?.raw ?? 0,
        totalServices: d.data.services?.raw ?? 0,
      });
    }).catch(() => {});
  }, [user.id]);

  const spentNum = parseFloat(stats.totalSpent);
  const userLevel = spentNum >= 10000 ? "Master" : spentNum >= 5000 ? "VIP" : spentNum >= 2000 ? "Elite" : spentNum >= 500 ? "Frequent" : spentNum >= 100 ? "Junior" : "New";
  const levels = ["New", "Junior", "Frequent", "Elite", "VIP", "Master"];
  const perks = [
    { name: "24/7 Tickets' Support",              levels: [true, true, true, true, true, true] },
    { name: "5% Payments Bonus",                   levels: [true, true, true, true, true, true] },
    { name: "$500 Monthly Lottery",                levels: [false, false, true, true, true, true] },
    { name: "Free SMM Panel",                      levels: [false, false, false, true, true, true] },
    { name: "Custom Services",                     levels: [false, false, false, false, true, true] },
    { name: "Early Notification on New Services",  levels: [false, false, false, false, true, true] },
    { name: "Support Handled by the Admins",       levels: [false, false, false, false, false, true] },
  ];
  const thresholds = [0, 100, 500, 2000, 5000, 10000];
  const nextLevel = levels[levels.indexOf(userLevel) + 1];
  const nextThreshold = thresholds[levels.indexOf(userLevel) + 1];
  const amountToNext = nextThreshold ? (nextThreshold - spentNum).toFixed(2) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-primary mb-4 text-sm uppercase tracking-wider">emazingSM</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Globe className="w-4 h-4" /> Total orders on site</span>
              <span className="text-sm font-bold text-primary">{siteStats.totalOrders.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Total users</span>
              <span className="text-sm font-bold text-primary">{siteStats.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Layers className="w-4 h-4" /> Services available</span>
              <span className="text-sm font-bold text-primary">{siteStats.totalServices.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-primary mb-4 text-sm uppercase tracking-wider">Your Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Your balance</span>
              <span className="text-sm font-bold text-primary">${stats.balance}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Money spent</span>
              <span className="text-sm font-bold">${stats.totalSpent}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Total orders</span>
              <span className="text-sm font-bold">{stats.totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold">User Level</h3>
          <span className="text-xs text-primary font-medium">${stats.totalSpent} SPENT · {userLevel.toUpperCase()}</span>
        </div>
        {amountToNext && nextLevel && (
          <div className="mt-3 mb-4 p-3 rounded-xl bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-semibold">Next Level: </span>
              Spend <span className="text-primary font-bold">${amountToNext}</span> more to reach <span className="font-bold">{nextLevel.toUpperCase()}</span>.
            </p>
          </div>
        )}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 font-medium text-muted-foreground w-1/3">Perk</th>
                {levels.map(l => (
                  <th key={l} className={`pb-3 text-center font-medium ${l === userLevel ? "text-primary" : "text-muted-foreground"}`}>{l.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perks.map(perk => (
                <tr key={perk.name} className="border-b border-border/30">
                  <td className="py-3.5 font-medium uppercase text-xs">{perk.name}</td>
                  {perk.levels.map((has, i) => (
                    <td key={i} className="py-3.5 text-center">
                      {has ? <span className={`inline-block w-3 h-3 rounded-full ${levels[i] === userLevel ? "bg-primary shadow-[0_0_8px_rgba(45,212,168,0.5)]" : "bg-muted-foreground/30"}`} /> : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/new-order"><Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10"><PlusCircle className="w-5 h-5 text-primary" /><span className="text-xs">New Campaign</span></Button></Link>
            <Link to="/dashboard/wallet"><Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10"><Wallet className="w-5 h-5 text-primary" /><span className="text-xs">Add Funds</span></Button></Link>
            <Link to="/dashboard/orders"><Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10"><Activity className="w-5 h-5 text-primary" /><span className="text-xs">My Orders</span></Button></Link>
            <Link to="/dashboard/affiliates"><Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:bg-primary/10"><Gift className="w-5 h-5 text-primary" /><span className="text-xs">Referral Program</span></Button></Link>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">AI Support</h3>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4"><MessageSquare className="w-8 h-8 text-primary-foreground" /></div>
            <p className="text-sm text-muted-foreground mb-4">Need help? Our AI assistant resolves issues instantly.</p>
            <Link to="/dashboard/support"><Button variant="outline" className="border-primary/30 hover:bg-primary/10">Open Chat</Button></Link>
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState("0.00");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) { navigate("/login"); return; }
    apiFetch("/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) { navigate("/login"); return; }
        setUser(d.user);
        setBalance(parseFloat(String(d.user?.wallet?.balance ?? 0)).toFixed(2));
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("esm_token");
    localStorage.removeItem("esm_user");
    navigate("/login");
  };

  const isAdmin = user?.roles?.includes("admin");
  const isHome = location.pathname === "/dashboard";
  const displayName = user?.profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Rocket className="w-8 h-8 text-primary animate-pulse" /></div>;
  }

  const SidebarContent = () => (
    <>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.labelKey + item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              <item.icon className="w-4 h-4" /> {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      {isAdmin && (
        <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary font-medium bg-primary/5 hover:bg-primary/10 transition-all mb-2">
          <Shield className="w-4 h-4" /> {t("nav.adminPanel")}
        </Link>
      )}
      <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-destructive mt-auto" onClick={handleLogout}>
        <LogOut className="w-4 h-4" /> {t("nav.logout")}
      </Button>
    </>
  );

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-full border-r border-border bg-sidebar p-4 shrink-0 overflow-y-auto">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2">
          <Rocket className="w-6 h-6 text-primary" />
          <span className="text-lg font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
        </Link>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar border-r border-border p-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-8 px-2">
              <Link to="/" className="flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                <span className="text-lg font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 h-full overflow-y-auto">
        <header className="sticky top-0 z-40 flex flex-col">
          {localStorage.getItem("esm_admin_token") && (
            <div className="bg-destructive/90 text-destructive-foreground px-4 py-1.5 flex flex-wrap items-center justify-center gap-3 text-sm font-medium w-full">
              <span>You are currently impersonating <strong>{user?.email}</strong></span>
              <Button size="sm" variant="secondary" className="h-6 text-[11px] px-3" onClick={() => {
                const adminToken = localStorage.getItem("esm_admin_token");
                if (adminToken) {
                  localStorage.setItem("esm_token", adminToken);
                  localStorage.removeItem("esm_admin_token");
                  window.location.href = import.meta.env.BASE_URL + "admin/users";
                }
              }}>Return to Admin</Button>
            </div>
          )}
          <div className="glass-strong border-b border-border flex items-center justify-between h-14 px-4 sm:px-6 w-full">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}><Menu className="w-5 h-5" /></Button>
              <h2 className="font-heading font-semibold text-lg">
                {t(navItems.find(n => n.path === location.pathname)?.labelKey || "nav.dashboard")}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher className="hidden sm:block" />
              <ThemeToggle />
              <div className="glass rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                <span className="text-muted-foreground hidden sm:inline">{t("dashboard.balance")}: </span>
                <span className="font-heading font-bold text-primary">${balance}</span>
              </div>
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {initials}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          {isHome && user ? <DashboardHome user={user} /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}
