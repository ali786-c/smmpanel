import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Gift, Users, DollarSign, TrendingUp, Percent, Eye, ArrowRightLeft, Loader2, Wallet, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Affiliates() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"affiliates" | "history">("affiliates");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    commissionRate: 1.5,
    totalVisits: 0,
    conversionRate: 0,
    availableEarnings: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, referralsRes] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("user_id", user.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id),
      ]);

      setReferralCode(profileRes.data?.referral_code || "");

      const referrals = referralsRes.data || [];
      const totalEarnings = referrals.reduce((sum, r: any) => sum + parseFloat(String(r.total_earnings || 0)), 0);

      setStats({
        totalReferrals: referrals.length,
        totalEarnings,
        commissionRate: 1.5,
        totalVisits: 0,
        conversionRate: referrals.length > 0 ? 100 : 0,
        availableEarnings: totalEarnings,
      });
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const statItems = [
    { icon: Percent, label: "Commission Rate:", value: `${stats.commissionRate}%`, color: "text-primary" },
    { icon: Eye, label: "Total Visits:", value: stats.totalVisits.toString(), color: "text-primary" },
    { icon: ArrowRightLeft, label: "Conversion Rate:", value: `${stats.conversionRate.toFixed(2)}%`, color: "text-primary" },
    { icon: Wallet, label: "Total Earnings:", value: `$${stats.totalEarnings.toFixed(2)}`, color: "text-primary" },
    { icon: Users, label: "Successful Referrals:", value: stats.totalReferrals.toString(), color: "text-primary" },
    { icon: TrendingUp, label: "Available Earnings:", value: `$${stats.availableEarnings.toFixed(2)}`, color: "text-primary" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Giveaway Banner */}
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
        <div className="relative z-10">
          <h2 className="text-2xl font-heading font-bold mb-3">
            Referral Program 🎁🎁
          </h2>
          <ul className="space-y-1.5 text-sm opacity-90">
            <li>• The top 5 referrers each month win bonus credits</li>
            <li>• Create content about us and earn $10 per approved submission*</li>
            <li>• Write a review article and earn $10*</li>
          </ul>
          <p className="text-xs mt-4 opacity-70">
            *Requires approval. Submit your content link via a support ticket. One per user.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("affiliates")}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "affiliates"
              ? "gradient-primary text-primary-foreground"
              : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          Affiliates
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "history"
              ? "gradient-primary text-primary-foreground"
              : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          Payment History
        </button>
      </div>

      {activeTab === "affiliates" ? (
        <>
          {/* Referral Link */}
          <div className="glass rounded-2xl p-6">
            <label className="text-xs text-muted-foreground font-medium mb-2 block">Referral Link:</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="flex-1 bg-secondary/50 rounded-lg px-4 py-3 text-sm font-mono truncate">
                {referralLink}
              </code>
              <Button onClick={copyLink} className="gradient-primary text-primary-foreground font-bold px-6 shrink-0">
                <Copy className="w-4 h-4 mr-2" />
                COPY YOUR LINK
              </Button>
            </div>
            {/* Social Share Buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on the best SMM platform! Use my referral link: ${referralLink}`)}`, "_blank")}
              >
                <Share2 className="w-3 h-3" /> Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this amazing SMM platform! ${referralLink}`)}`, "_blank")}
              >
                <Share2 className="w-3 h-3" /> WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank")}
              >
                <Share2 className="w-3 h-3" /> Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join the best SMM platform!")}`, "_blank")}
              >
                <Share2 className="w-3 h-3" /> Telegram
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statItems.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-lg font-heading font-bold text-primary">{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-xs text-muted-foreground font-medium uppercase">Date</th>
                  <th className="text-left pb-3 text-xs text-muted-foreground font-medium uppercase">Type</th>
                  <th className="text-left pb-3 text-xs text-muted-foreground font-medium uppercase">Amount</th>
                  <th className="text-left pb-3 text-xs text-muted-foreground font-medium uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    No payment history yet. Start referring users to earn commissions!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
