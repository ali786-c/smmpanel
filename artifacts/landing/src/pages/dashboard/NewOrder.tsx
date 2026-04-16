import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingCart, Search, AlertCircle, Loader2, Clock, Zap, Shield, RotateCcw,
  Instagram, Youtube, Twitter, Facebook, Music, MessageCircle, Globe,
  Linkedin, Monitor, Headphones, Star, MoreHorizontal, List, Tag, Share2, Copy
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string;
  platform: string;
  rate: number;
  min_order: number;
  max_order: number;
  health_score: number;
  refill: boolean;
  cancel: boolean;
  type: string;
  external_service_id: number;
}

const platformIcons: Record<string, any> = {
  Instagram, YouTube: Youtube, Twitter, Facebook, TikTok: Music,
  Telegram: MessageCircle, Discord: Headphones, LinkedIn: Linkedin,
  Spotify: Music, Google: Globe, Snapchat: Monitor, Twitch: Monitor,
  Other: MoreHorizontal,
};

const platformList = [
  "Instagram", "Facebook", "YouTube", "Twitter", "Spotify", "TikTok",
  "LinkedIn", "Google", "Telegram", "Discord", "Snapchat", "Twitch",
  "Other", "Everything",
];

type Tab = "new" | "favorites" | "subscription";

export default function NewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dripFeed, setDripFeed] = useState(false);
  const [dripRuns, setDripRuns] = useState("");
  const [dripInterval, setDripInterval] = useState("");

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [servicesRes, walletRes, favsRes] = await Promise.all([
        supabase.from("services").select("*").eq("is_active", true).order("display_order"),
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
        supabase.from("favorite_services").select("service_id").eq("user_id", user.id),
      ]);
      setServices((servicesRes.data as Service[]) || []);
      setBalance(walletRes.data?.balance || 0);
      setFavorites(new Set((favsRes.data || []).map((f: any) => f.service_id)));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredByPlatform = useMemo(() => {
    if (!selectedPlatform || selectedPlatform === "Everything") return services;
    return services.filter((s) => s.platform.toLowerCase() === selectedPlatform.toLowerCase());
  }, [services, selectedPlatform]);

  const categories = useMemo(() => [...new Set(filteredByPlatform.map((s) => s.category))], [filteredByPlatform]);

  const filteredServices = useMemo(() => {
    let result = filteredByPlatform;
    if (selectedCategory) result = result.filter((s) => s.category === selectedCategory);
    if (searchQuery) result = result.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.external_service_id.toString().includes(searchQuery));
    return result;
  }, [filteredByPlatform, selectedCategory, searchQuery]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const qty = parseInt(quantity) || 0;
  const rawCost = selectedService ? parseFloat(((selectedService.rate / 1000) * qty).toFixed(4)) : 0;
  const cost = Math.max(0, rawCost - couponDiscount);
  const canOrder =
    selectedService &&
    link.trim() &&
    qty >= (selectedService?.min_order || 0) &&
    qty <= (selectedService?.max_order || 0) &&
    cost <= balance;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data: rawData, error } = await supabase.rpc("validate_coupon", {
      _code: couponCode.trim().toUpperCase(),
      _order_amount: rawCost,
    });
    const result = rawData as Record<string, any> | null;

    if (error || !result || !result.valid) {
      toast.error(result?.error || "Invalid or expired coupon code");
      setCouponLoading(false);
      return;
    }

    setCouponDiscount(Number(result.discount));
    setCouponApplied(result.code);
    toast.success(`Coupon applied! -$${Number(result.discount).toFixed(4)}`);
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponDiscount(0);
    setCouponApplied(null);
    setCouponCode("");
  };

  const handleSubmit = async () => {
    if (!user || !selectedService || !canOrder) return;
    setSubmitting(true);
    try {
      const body: any = { action: "add", serviceId: selectedService.id, link: link.trim(), quantity: qty };
      if (dripFeed && dripRuns && dripInterval) {
        body.runs = parseInt(dripRuns);
        body.interval = parseInt(dripInterval);
      }
      if (couponApplied) {
        body.couponCode = couponApplied;
      }
      const { error } = await supabase.functions.invoke("provider-proxy", { body });
      if (error) throw error;
      toast.success("Campaign launched successfully!");
      navigate("/dashboard/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to launch campaign");
    } finally {
      setSubmitting(false);
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
      {/* Platform Grid */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Choose a Platform</p>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {platformList.map((p) => {
            const Icon = p === "Everything" ? List : (platformIcons[p] || Globe);
            const isActive = selectedPlatform === p;
            return (
              <button
                key={p}
                onClick={() => { setSelectedPlatform(isActive ? null : p); setSelectedCategory(""); setSelectedServiceId(""); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs transition-all ${
                  isActive
                    ? "gradient-primary text-primary-foreground font-semibold"
                    : "glass hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate w-full text-center">{p}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0">
        {([["new", "NEW ORDER"], ["favorites", "MY FAVORITES"], ["subscription", "AUTO SUBSCRIPTION"]] as [Tab, string][]).map(
          ([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                activeTab === tab
                  ? "gradient-primary text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {activeTab === "new" && (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Order Form */}
          <div className="flex-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search services by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="glass rounded-xl p-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setSelectedServiceId(""); }}
                  className="w-full bg-transparent text-sm focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Service */}
            <div className="glass rounded-xl p-3">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              >
                <option value="">Select a service</option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.external_service_id} - {s.name} — ${s.rate.toFixed(4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Link */}
            <div className="space-y-1">
              <Label className="text-sm">Link</Label>
              <Input
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <Label className="text-sm">Quantity</Label>
              <Input
                type="number"
                placeholder={selectedService ? `Min: ${selectedService.min_order} — Max: ${selectedService.max_order.toLocaleString()}` : "Select a service first"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-secondary/50"
              />
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  Min: {selectedService.min_order.toLocaleString()} — Max: {selectedService.max_order.toLocaleString()}
                </p>
              )}
            </div>

            {/* Drip-feed */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="drip"
                checked={dripFeed}
                onCheckedChange={(v) => setDripFeed(!!v)}
              />
              <Label htmlFor="drip" className="text-sm cursor-pointer">Drip-feed (gradual delivery)</Label>
            </div>
            {dripFeed && (
              <div className="glass rounded-xl p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Split your order into multiple runs delivered at set intervals.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Number of Runs</Label>
                    <Input type="number" placeholder="e.g. 10" value={dripRuns} onChange={(e) => setDripRuns(e.target.value)} className="bg-secondary/50" min="2" />
                    <p className="text-xs text-muted-foreground">
                      {dripRuns && qty > 0 ? `~${Math.floor(qty / parseInt(dripRuns || "1"))} per run` : ""}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Interval (minutes)</Label>
                    <Input type="number" placeholder="e.g. 60" value={dripInterval} onChange={(e) => setDripInterval(e.target.value)} className="bg-secondary/50" min="1" />
                    <p className="text-xs text-muted-foreground">
                      {dripInterval && dripRuns ? `Total: ~${Math.round((parseInt(dripInterval) * parseInt(dripRuns)) / 60)}h` : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Coupon Code */}
            <div className="space-y-1">
              <Label className="text-sm flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Coupon Code
              </Label>
              {couponApplied ? (
                <div className="flex items-center gap-2 glass rounded-xl p-3">
                  <Badge className="bg-primary/20 text-primary border-0 text-xs">
                    <Tag className="w-3 h-3 mr-1" /> {couponApplied}
                  </Badge>
                  <span className="text-xs text-primary font-medium">-${couponDiscount.toFixed(4)}</span>
                  <Button variant="ghost" size="sm" onClick={removeCoupon} className="ml-auto text-xs text-destructive h-7">
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="bg-secondary/50 flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="shrink-0"
                  >
                    {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Average Time */}
            {selectedService && (
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Average time</p>
                <p className="text-sm font-medium">Estimated delivery based on quantity</p>
              </div>
            )}

            {/* Charge */}
            <div className="glass rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Charge</span>
                <div className="text-right">
                  {couponDiscount > 0 && (
                    <span className="text-xs text-muted-foreground line-through mr-2">${rawCost.toFixed(4)}</span>
                  )}
                  <span className="text-lg font-heading font-bold text-primary">${cost.toFixed(4)}</span>
                </div>
              </div>
              {cost > balance && (
                <div className="flex items-center gap-2 text-xs text-destructive mt-2">
                  <AlertCircle className="w-3 h-3" />
                  Insufficient balance (${balance.toFixed(2)} available)
                </div>
              )}
            </div>

            {/* No Refund Notice */}
            <p className="text-xs text-muted-foreground text-center">
              <span className="text-destructive font-medium">⚠ No refunds.</span> All orders are final once submitted. By clicking Submit you agree to our <a href="/terms" className="text-primary hover:underline">Terms</a>.
            </p>

            {/* Submit */}
            <Button
              className="w-full gradient-primary text-primary-foreground font-bold text-base py-6"
              disabled={!canOrder || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> SUBMITTING...</>
              ) : (
                "SUBMIT"
              )}
            </Button>
          </div>

          {/* Service Details Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="glass rounded-2xl p-5 sticky top-20">
              <h3 className="font-heading font-semibold mb-4 flex items-center justify-between">
                <span>SERVICE DETAILS</span>
                {selectedService && (
                  <button
                    onClick={async () => {
                      if (!user) return;
                      if (favorites.has(selectedService.id)) {
                        await supabase.from("favorite_services").delete().eq("user_id", user.id).eq("service_id", selectedService.id);
                        setFavorites((prev) => { const n = new Set(prev); n.delete(selectedService.id); return n; });
                      } else {
                        await supabase.from("favorite_services").insert({ user_id: user.id, service_id: selectedService.id });
                        setFavorites((prev) => new Set(prev).add(selectedService.id));
                      }
                    }}
                    className="text-warning hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${favorites.has(selectedService.id) ? "fill-current" : ""}`} />
                  </button>
                )}
              </h3>
              {selectedService ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedService.external_service_id} - {selectedService.name}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">START TIME</p>
                      <p className="text-sm font-semibold text-primary">0 - 1 Hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SPEED</p>
                      <p className="text-sm font-semibold text-primary">Fast</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GUARANTEED</p>
                      <p className="text-sm font-semibold text-primary">
                        {selectedService.refill ? (
                          <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Refill</span>
                        ) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AVERAGE TIME</p>
                      <p className="text-sm font-semibold text-primary">~2-6 hours</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedService.refill && (
                      <Badge className="text-xs bg-primary/20 text-primary border-0">
                        <RotateCcw className="w-3 h-3 mr-1" /> Refill
                      </Badge>
                    )}
                    {selectedService.cancel && (
                      <Badge className="text-xs bg-warning/20 text-warning border-0">
                        <Shield className="w-3 h-3 mr-1" /> Cancel
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">RATE</p>
                    <p className="text-lg font-heading font-bold text-primary">${selectedService.rate.toFixed(4)} / 1K</p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Min: {selectedService.min_order.toLocaleString()}</p>
                    <p>Max: {selectedService.max_order.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Select a service to see details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-3">
          {services.filter((s) => favorites.has(s.id)).length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No favorite services yet.</p>
              <p className="text-xs mt-1">Star services from the order form to add them here.</p>
            </div>
          ) : (
            services.filter((s) => favorites.has(s.id)).map((s) => (
              <div key={s.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.platform} · ${s.rate.toFixed(4)}/1K</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => { setActiveTab("new"); setSelectedServiceId(s.id); }}>
                    Order
                  </Button>
                  <Button variant="ghost" size="icon" className="text-warning" onClick={async () => {
                    if (!user) return;
                    await supabase.from("favorite_services").delete().eq("user_id", user.id).eq("service_id", s.id);
                    setFavorites((prev) => { const n = new Set(prev); n.delete(s.id); return n; });
                  }}>
                    <Star className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "subscription" && (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm">Auto subscription coming soon.</p>
          <p className="text-xs mt-1">Schedule recurring orders automatically.</p>
        </div>
      )}
    </div>
  );
}
