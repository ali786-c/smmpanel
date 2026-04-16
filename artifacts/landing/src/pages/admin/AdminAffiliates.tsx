import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, Users, DollarSign, Percent, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_rate: number;
  total_earnings: number;
  status: string;
  created_at: string;
  referrerName?: string;
  referredName?: string;
}

export default function AdminAffiliates() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [newRate, setNewRate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [referralsRes, profilesRes] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name"),
    ]);

    const nameMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => {
      nameMap[p.user_id] = p.display_name || p.user_id.slice(0, 8);
    });

    setReferrals(
      (referralsRes.data || []).map((r: any) => ({
        ...r,
        referrerName: nameMap[r.referrer_id] || r.referrer_id.slice(0, 8),
        referredName: nameMap[r.referred_id] || r.referred_id.slice(0, 8),
      }))
    );
    setLoading(false);
  };

  const handleUpdateRate = async (id: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Invalid rate");
      return;
    }
    const { error } = await supabase
      .from("referrals")
      .update({ commission_rate: rate / 100 })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, commission_rate: rate / 100 } : r))
    );
    setEditingRate(null);
    setNewRate("");
    toast.success("Commission rate updated");
  };

  const filtered = referrals.filter(
    (r) =>
      !search ||
      r.referrerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.referredName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalEarnings = referrals.reduce((s, r) => s + r.total_earnings, 0);
  const activeReferrals = referrals.filter((r) => r.status === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Referrals</p>
          <p className="text-2xl font-heading font-bold">{referrals.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-heading font-bold text-primary">{activeReferrals}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Earnings Paid</p>
          <p className="text-2xl font-heading font-bold text-primary">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Avg Commission</p>
          <p className="text-2xl font-heading font-bold">
            {referrals.length > 0
              ? (
                  (referrals.reduce((s, r) => s + r.commission_rate, 0) /
                    referrals.length) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by referrer or referred user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">Referrer</th>
              <th className="pb-3 font-medium">Referred</th>
              <th className="pb-3 font-medium">Commission</th>
              <th className="pb-3 font-medium">Earnings</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                <td className="py-3">{r.referrerName}</td>
                <td className="py-3">{r.referredName}</td>
                <td className="py-3">
                  {editingRate === r.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        className="w-16 h-7 text-xs"
                        placeholder="%"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUpdateRate(r.id)}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRate(r.id);
                        setNewRate((r.commission_rate * 100).toString());
                      }}
                      className="text-primary hover:underline"
                    >
                      {(r.commission_rate * 100).toFixed(1)}%
                    </button>
                  )}
                </td>
                <td className="py-3 font-heading font-semibold text-primary">
                  ${r.total_earnings.toFixed(2)}
                </td>
                <td className="py-3">
                  <Badge
                    className={`text-xs border-0 ${
                      r.status === "active"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="py-3 text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "MMM d, yyyy")}
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setEditingRate(r.id);
                      setNewRate((r.commission_rate * 100).toString());
                    }}
                  >
                    Edit Rate
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No referrals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
