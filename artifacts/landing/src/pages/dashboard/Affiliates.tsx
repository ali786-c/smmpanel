import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Copy, Gift, Users, DollarSign, TrendingUp, Percent, Eye, ArrowRightLeft, Loader2, Wallet, Share2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Affiliates() {
  const [activeTab, setActiveTab] = useState<"affiliates" | "history">("affiliates");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    commissionRate: 1.5,
    totalVisits: 0,
    conversionRate: 0,
    availableBalance: 0,
  });

  const fetchStats = () => {
    apiFetch("/affiliates/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setReferralCode(d.referral_code ?? "");
        setStats({
          totalReferrals: d.total_referrals ?? 0,
          totalEarnings: parseFloat(d.total_earnings ?? 0),
          commissionRate: parseFloat(d.commission_rate ?? 1.5),
          totalVisits: d.total_visits ?? 0,
          conversionRate: d.conversion_rate ?? 0,
          availableBalance: parseFloat(d.available_balance ?? 0),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const handlePayout = async () => {
    if (stats.availableBalance < 10) {
      toast.error("Minimum $10 required to payout.");
      return;
    }

    setProcessingPayout(true);
    try {
      const res = await apiFetch("/affiliates/convert", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payout failed");
      
      toast.success(data.message || "Earnings converted to wallet credit!");
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const payoutProgress = Math.min((stats.availableBalance / 10) * 100, 100);

  const statItems = [
    { icon: Percent, label: "Commission", value: `${stats.commissionRate}%` },
    { icon: Eye, label: "Visits", value: stats.totalVisits.toString() },
    { icon: ArrowRightLeft, label: "Conversion", value: `${stats.conversionRate.toFixed(1)}%` },
    { icon: Users, label: "Referrals", value: stats.totalReferrals.toString() },
    { icon: TrendingUp, label: "Total Earned", value: `$${stats.totalEarnings.toFixed(2)}` },
    { icon: Wallet, label: "Pending", value: `$${stats.availableBalance.toFixed(2)}` },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Introduction Card */}
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Gift className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-heading font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> Affiliate Program
            </h2>
            <p className="text-sm opacity-90 mb-4">
                Earn <b>{stats.commissionRate}% commission</b> on the first order placed by users you refer. 
                Earnings are added to your available balance and can be converted to wallet credit once you reach $10.00.
            </p>
            <div className="flex gap-4 text-xs font-medium opacity-80 italic">
                <span>• No limit on referrals</span>
                <span>• Instant wallet conversion</span>
            </div>
          </div>
          
          <div className="glass bg-white/10 p-5 rounded-2xl min-w-[280px]">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-medium uppercase opacity-80 font-heading">Progress to Payout</span>
                <span className="text-sm font-bold font-mono">${stats.availableBalance.toFixed(2)} / $10.00</span>
            </div>
            <Progress value={payoutProgress} className="h-2 mb-4 bg-white/20" />
            <Button 
                onClick={handlePayout}
                disabled={stats.availableBalance < 10 || processingPayout}
                className="w-full bg-white text-primary hover:bg-white/90 font-bold transition-all shadow-lg active:scale-95"
            >
                {processingPayout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                {stats.availableBalance >= 10 ? "Convert to Credit Now" : `Needs $${(10 - stats.availableBalance).toFixed(2)} More`}
            </Button>
            {stats.availableBalance < 10 && (
                <p className="text-[10px] mt-2 text-center opacity-70 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Minimum $10 required for credit addition
                </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["affiliates", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all uppercase tracking-wider ${activeTab === tab ? "gradient-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"}`}>
            {tab === "affiliates" ? "Dashboard" : "Commission History"}
          </button>
        ))}
      </div>

      {activeTab === "affiliates" ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statItems.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center border-b-2 border-transparent hover:border-primary transition-colors group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl font-heading font-bold text-primary">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Referral Link Card */}
          <div className="glass rounded-2xl p-8 relative overflow-hidden bg-gradient-to-br from-white/5 to-primary/5">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-heading font-bold flex items-center gap-2 italic">
                        <Share2 className="w-6 h-6 text-primary" /> Share & Earn
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Copy your unique referral link and share it on social media, blogs, or with your friends. 
                        When they sign up and place their first order, you get paid!
                    </p>
                    <div className="flex gap-2 mt-4 overflow-hidden">
                        <div className="flex-1 glass border-primary/20 rounded-xl px-4 py-3 font-mono text-sm text-primary truncate select-all bg-primary/5">
                            {referralCode ? referralLink : "Generating code..."}
                        </div>
                        <Button size="icon" className="gradient-primary text-primary-foreground h-12 w-12 rounded-xl shrink-0" onClick={copyLink}>
                            <Copy className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                
                <div className="flex gap-4 flex-wrap justify-center min-w-[250px]">
                    <div className="flex flex-col gap-2 w-full">
                        <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/30 hover:bg-primary/5 rounded-xl font-medium" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out this amazing SMM platform! " + referralLink)}`, "_blank")}>
                            <Share2 className="w-4 h-4 text-sky-500" /> Share on X / Twitter
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/30 hover:bg-primary/5 rounded-xl font-medium" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Best SMM platform with fast delivery!")}`, "_blank")}>
                            <Share2 className="w-4 h-4 text-blue-400" /> Send via Telegram
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/30 hover:bg-primary/5 rounded-xl font-medium" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Join the best SMM platform! " + referralLink)}`, "_blank")}>
                            <Share2 className="w-4 h-4 text-green-500" /> Share on WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary/5 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="text-left px-6 py-4">User</th>
                  <th className="text-left px-6 py-4">Date</th>
                  <th className="text-left px-6 py-4">Commission</th>
                  <th className="text-left px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {stats.referrals.length > 0 ? (
                  stats.referrals.map((ref: any) => (
                    <tr key={ref.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{ref.referred?.profile?.display_name || "New User"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-primary">${parseFloat(ref.total_earnings).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ref.status === "active" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                          {ref.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-muted-foreground italic">
                        <div className="flex flex-col items-center gap-3">
                            <Users className="w-12 h-12 opacity-10" />
                            <p>No referrals yet. Share your link to start earning!</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
