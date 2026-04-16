import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, Users, Shield, Ban, DollarSign, Eye } from "lucide-react";

interface UserRow {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  balance: number;
  orderCount: number;
  totalSpent: number;
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      // Fetch profiles, wallets, orders, and roles
      const [profilesRes, walletsRes, ordersRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, phone, created_at"),
        supabase.from("wallets").select("user_id, balance"),
        supabase.from("orders").select("user_id, cost"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const profiles = profilesRes.data || [];
      const wallets = walletsRes.data || [];
      const orders = ordersRes.data || [];
      const roles = rolesRes.data || [];

      const walletMap = new Map(wallets.map((w: any) => [w.user_id, parseFloat(String(w.balance))]));
      const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

      // Aggregate orders per user
      const orderAgg = new Map<string, { count: number; spent: number }>();
      orders.forEach((o: any) => {
        const existing = orderAgg.get(o.user_id) || { count: 0, spent: 0 };
        existing.count++;
        existing.spent += parseFloat(String(o.cost || 0));
        orderAgg.set(o.user_id, existing);
      });

      const userRows: UserRow[] = profiles.map((p: any) => {
        const agg = orderAgg.get(p.user_id) || { count: 0, spent: 0 };
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          phone: p.phone,
          created_at: p.created_at,
          balance: walletMap.get(p.user_id) || 0,
          orderCount: agg.count,
          totalSpent: agg.spent,
          role: roleMap.get(p.user_id) || "user",
        };
      });

      setUsers(userRows.sort((a, b) => b.totalSpent - a.totalSpent));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name?.toLowerCase() || "").includes(q) ||
      u.user_id.toLowerCase().includes(q) ||
      (u.phone?.toLowerCase() || "").includes(q)
    );
  });

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    if (currentRole === "admin") {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) {
        toast.error("Failed to remove admin role");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: "user" } : u)));
      toast.success("Admin role removed");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error) {
        toast.error("Failed to add admin role");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: "admin" } : u)));
      toast.success("Admin role granted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-xl font-heading font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admins</p>
              <p className="text-xl font-heading font-bold">{users.filter((u) => u.role === "admin").length}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Balances</p>
              <p className="text-xl font-heading font-bold">${users.reduce((s, u) => s + u.balance, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or phone..."
            className="pl-10 bg-secondary/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">User</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Balance</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Orders</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Total Spent</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Role</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Joined</th>
                <th className="text-left pb-3 text-xs text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">No users found</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.user_id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-sm">{user.display_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.user_id.slice(0, 12)}...</p>
                      </div>
                    </td>
                    <td className="py-3 text-sm font-medium text-primary">${user.balance.toFixed(2)}</td>
                    <td className="py-3 text-sm">{user.orderCount}</td>
                    <td className="py-3 text-sm">${user.totalSpent.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 flex gap-1">
                      <Link to={`/admin/users/${user.user_id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdmin(user.user_id, user.role)}
                        className="text-xs"
                      >
                        {user.role === "admin" ? (
                          <><Ban className="w-3 h-3 mr-1" /> Remove Admin</>
                        ) : (
                          <><Shield className="w-3 h-3 mr-1" /> Make Admin</>
                        )}
                      </Button>
                    </td>
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
