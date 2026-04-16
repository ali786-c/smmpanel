import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Copy, Gift, Users, DollarSign, TrendingUp, Percent, Eye, ArrowRightLeft, Loader2, Wallet, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Affiliates() {
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
    apiFetch("/profile/referrals")
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
          availableEarnings: parseFloat(d.available_earnings ?? d.total_earnings ?? 0),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const referralLink = `${window.location.origin}/landing/signup?ref=${referralCode}`;

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
    { icon: Percent, label: "Commission Rate:", value: `${stats.commissionRate}%` },
    { icon: Eye, label: "Total Visits:", value: stats.totalVisits.toString() },
    { icon: ArrowRightLeft, label: "Conversion Rate:", value: `${stats.conversionRate.toFixed(2)}%` },
    { icon: Wallet, label: "Total Earnings:", value: `$${stats.totalEarnings.toFixed(2)}` },
    { icon: Users, label: "Successful Referrals:", value: stats.totalReferrals.toString() },
    { icon: TrendingUp, label: "Available Earnings:", value: `$${stats.availableEarnings.toFixed(2)}` },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
        <div className="relative z-10">
          <h2 className="text-2xl font-heading font-bold mb-3">Referral Program 🎁🎁</h2>
          <ul className="space-y-1.5 text-sm opacity-90">
            <li>• The top 5 referrers each month win bonus credits</li>
            <li>• Create content about us and earn $10 per approved submission*</li>
            <li>• Write a review article and earn $10*</li>
          </ul>
          <p className="text-xs mt-4 opacity-70">*Requires approval. Submit your content link via a support ticket. One per user.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["affiliates", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            {tab === "affiliates" ? "AFFILIATES" : "PAYMENT HISTORY"}
          </button>
        ))}
      </div>

      {activeTab === "affiliates" ? (
        <>
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Your Referral Link</h3>
            <div className="flex gap-2">
              <div className="flex-1 glass rounded-xl px-4 py-3 font-mono text-xs text-muted-foreground truncate">{referralCode ? referralLink : "No referral code yet"}</div>
              <Button size="icon" variant="outline" onClick={copyLink} className="border-primary/30 hover:bg-primary/10 shrink-0"><Copy className="w-4 h-4" /></Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={copyLink}><Copy className="w-3 h-3" /> Copy Link</Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join the best SMM platform! " + referralLink)}`, "_blank")}><Share2 className="w-3 h-3" /> Twitter</Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join the best SMM platform!")}`, "_blank")}><Share2 className="w-3 h-3" /> Telegram</Button>
            </div>
          </div>

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
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">No payment history yet. Start referring users to earn commissions!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
