import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  ShoppingCart, Search, AlertCircle, Loader2, Clock, RotateCcw,
  Instagram, Youtube, Twitter, Facebook, Music, MessageCircle, Globe,
  Linkedin, Monitor, Headphones, Star, MoreHorizontal, List, Tag, Copy
} from "lucide-react";

interface Service {
  id: string; name: string; category: string; platform: string;
  rate: number; min_order: number; max_order: number;
  refill: boolean; cancel: boolean; type: string; external_service_id: number;
  is_favorite?: boolean;
}

const platformIcons: Record<string, any> = {
  Instagram, YouTube: Youtube, Twitter, Facebook, TikTok: Music,
  Telegram: MessageCircle, Discord: Headphones, LinkedIn: Linkedin,
  Spotify: Music, Google: Globe, Snapchat: Monitor, Twitch: Monitor,
  Other: MoreHorizontal,
};

const platformList = [
  "Instagram","Facebook","YouTube","Twitter","Spotify","TikTok",
  "LinkedIn","Google","Telegram","Discord","Snapchat","Twitch","Other","Everything",
];

type Tab = "new" | "favorites" | "subscription";

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesCache, setServicesCache] = useState<Record<string, Service[]>>({});
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get("service") ?? "");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dripFeed, setDripFeed] = useState(false);
  const [dripRuns, setDripRuns] = useState("");
  const [dripInterval, setDripInterval] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Function to fetch services for a specific platform
  const fetchServices = async (platform: string, isInitial = false) => {
    if (servicesCache[platform] && !isInitial) {
      setServices(servicesCache[platform]);
      return;
    }

    setFetching(true);
    try {
      const url = platform === "Everything" 
        ? "/services?per_page=500" 
        : `/services?platform=${encodeURIComponent(platform)}&per_page=500`;
      
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = data?.data ?? data?.services ?? data ?? [];
        const svcs: Service[] = Array.isArray(list) ? list : [];
        
        setServices(svcs);
        setServicesCache(prev => ({ ...prev, [platform]: svcs }));
        
        // Update favorites set if it's the first load or we find new favorites
        const favIds = svcs.filter(s => s.is_favorite).map(s => s.id);
        if (favIds.length > 0) {
          setFavorites(prev => new Set([...Array.from(prev), ...favIds]));
        }
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
      toast.error("Failed to load services for " + platform);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Fetch Wallet Balance
        const walletRes = await apiFetch("/wallet");
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setBalance(parseFloat(walletData?.balance ?? walletData?.wallet?.balance ?? 0));
        }

        // 2. Fetch Favorites (so the favorites tab works)
        const favRes = await apiFetch("/services/favorites");
        if (favRes.ok) {
          const favData = await favRes.json();
          const favList = Array.isArray(favData) ? favData : (favData?.data ?? []);
          setFavorites(new Set(favList.map((s: any) => s.id)));
        }

        // 3. Fetch default services (Instagram)
        const defaultPlatform = "Instagram";
        setSelectedPlatform(defaultPlatform);
        await fetchServices(defaultPlatform, true);

      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handlePlatformClick = (p: string) => {
    if (selectedPlatform === p) return;
    setSelectedPlatform(p);
    setSelectedCategory("");
    setSelectedServiceId("");
    fetchServices(p);
  };


  const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId) ?? null, [services, selectedServiceId]);
  const qty = parseInt(quantity) || 0;
  const rawCost = selectedService ? (selectedService.rate / 1000) * qty : 0;
  const finalCost = Math.max(0, rawCost - couponDiscount);
  const canOrder = selectedService && link.trim() && qty >= (selectedService?.min_order ?? 1) && qty <= (selectedService?.max_order ?? 999999) && balance >= finalCost;

  const filteredByPlatform = useMemo(() => {
    if (!selectedPlatform || selectedPlatform === "Everything") return services;
    return services.filter(s => s.platform.toLowerCase() === selectedPlatform.toLowerCase());
  }, [services, selectedPlatform]);

  const categories = useMemo(() => [...new Set(filteredByPlatform.map(s => s.category))], [filteredByPlatform]);

  const filteredServices = useMemo(() => {
    let result = filteredByPlatform;
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    if (searchQuery) result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [filteredByPlatform, selectedCategory, searchQuery]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const res = await apiFetch("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code: couponCode.trim().toUpperCase(), amount: rawCost }),
    });
    if (res.ok) {
      const d = await res.json();
      setCouponDiscount(Number(d.discount));
      setCouponApplied(d.code);
      toast.success(`Coupon applied! -$${Number(d.discount).toFixed(4)}`);
    } else {
      const e = await res.json();
      toast.error(e.error ?? "Invalid or expired coupon code");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponDiscount(0); setCouponApplied(null); setCouponCode(""); };

  const toggleFavorite = async (serviceId: string) => {
    await apiFetch(`/services/${serviceId}/favorite`);
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId); else next.add(serviceId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedService || !canOrder) return;
    setSubmitting(true);
    try {
      const body: any = { service_id: selectedService.id, link: link.trim(), quantity: qty };
      if (dripFeed && dripRuns && dripInterval) { body.runs = parseInt(dripRuns); body.interval = parseInt(dripInterval); }
      if (couponApplied) body.coupon_code = couponApplied;
      const res = await apiFetch("/orders", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to launch campaign"); }
      toast.success("Campaign launched successfully!");
      navigate("/dashboard/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to launch campaign");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Platform Grid */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Choose a Platform</p>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {platformList.map(p => {
            const Icon = p === "Everything" ? List : (platformIcons[p] || Globe);
            const isActive = selectedPlatform === p;
            return (
              <button key={p} onClick={() => handlePlatformClick(p)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs transition-all ${isActive ? "gradient-primary text-primary-foreground font-semibold" : "glass hover:bg-secondary/50 text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-4 h-4" />
                <span className="truncate w-full text-center">{p}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0">
        {([["new","NEW ORDER"],["favorites","MY FAVORITES"],["subscription","AUTO SUBSCRIPTION"]] as [Tab,string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold transition-all rounded-t-xl ${activeTab === tab ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "new" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Service Selector */}
          <div className="flex-1 space-y-4">
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search services..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50" />
              </div>
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setSelectedCategory("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedCategory ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>All</button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>{cat}</button>
                  ))}
                </div>
              )}
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {fetching ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Loader2 className="w-5 h-5 animate-spin mb-2" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Syncing {selectedPlatform} Services...</p>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No services found. Select a platform or clear search.</p>
                ) : filteredServices.map(svc => (
                  <div key={svc.id} className="relative group">
                    <button onClick={() => setSelectedServiceId(svc.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-all ${selectedServiceId === svc.id ? "gradient-primary text-primary-foreground" : "hover:bg-secondary/50 glass"}`}>
                      <div className="min-w-0 flex-1 pr-8">
                        <p className="font-medium truncate">{svc.name}</p>
                        <p className={`text-xs ${selectedServiceId === svc.id ? "opacity-70" : "text-muted-foreground"}`}>{svc.category}</p>
                      </div>
                      <span className={`text-xs font-semibold ml-2 shrink-0 ${selectedServiceId === svc.id ? "text-primary-foreground" : "text-primary"}`}>${Number(svc.rate).toFixed(4)}/1K</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(svc.id); }}
                      className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all hover:scale-110 ${favorites.has(svc.id) ? "text-warning" : "text-muted-foreground/30 hover:text-warning"}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${favorites.has(svc.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedService && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Link</Label>
                  <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity <span className="text-primary">({selectedService.min_order} – {selectedService.max_order.toLocaleString()})</span></Label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min={selectedService.min_order} max={selectedService.max_order} placeholder={String(selectedService.min_order)} className="bg-secondary/50" />
                </div>

                {/* Drip Feed */}
                <div className="flex items-center gap-2">
                  <Checkbox id="drip" checked={dripFeed} onCheckedChange={v => setDripFeed(!!v)} />
                  <Label htmlFor="drip" className="text-sm cursor-pointer">Enable Drip Feed</Label>
                </div>
                {dripFeed && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Runs</Label>
                      <Input type="number" value={dripRuns} onChange={e => setDripRuns(e.target.value)} placeholder="10" className="bg-secondary/50" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Interval (min)</Label>
                      <Input type="number" value={dripInterval} onChange={e => setDripInterval(e.target.value)} placeholder="60" className="bg-secondary/50" />
                    </div>
                  </div>
                )}

                {/* Coupon */}
                {!couponApplied ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="COUPON CODE" className="pl-9 bg-secondary/50 font-mono text-xs" onKeyDown={e => e.key === "Enter" && applyCoupon()} />
                    </div>
                    <Button size="sm" variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="shrink-0 border-primary/30">
                      {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2 text-xs">
                    <span className="text-primary font-medium">🎉 {couponApplied} applied! −${couponDiscount.toFixed(4)}</span>
                    <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  <span className="text-destructive font-medium">⚠ No refunds.</span> All orders are final. By proceeding you agree to our <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
                </p>
                <Button onClick={handleSubmit} disabled={!canOrder || submitting} className="w-full gradient-primary text-primary-foreground font-bold text-base py-6">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />LAUNCHING...</> : <><ShoppingCart className="w-4 h-4 mr-2" />LAUNCH CAMPAIGN — ${finalCost.toFixed(4)}</>}
                </Button>
                {!canOrder && balance < finalCost && finalCost > 0 && (
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Balance</AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col gap-3">
                      <p>You need an additional ${(finalCost - balance).toFixed(4)} to place this order.</p>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full font-bold"
                        onClick={() => navigate("/dashboard/wallet")}
                      >
                        TOP UP WALLET
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Service Details Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="glass rounded-2xl p-5 sticky top-20">
              <h3 className="font-heading font-semibold mb-4 flex items-center justify-between">
                <span>SERVICE DETAILS</span>
                {selectedService && (
                  <button onClick={() => toggleFavorite(selectedService.id)} className="text-warning hover:scale-110 transition-transform">
                    <Star className={`w-5 h-5 ${favorites.has(selectedService.id) ? "fill-current" : ""}`} />
                  </button>
                )}
              </h3>
              {selectedService ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedService.external_service_id} - {selectedService.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["START TIME", "0 - 1 Hrs"], ["SPEED", "Fast"],
                      ["GUARANTEED", selectedService.refill ? "Refill" : "N/A"],
                      ["AVERAGE TIME", "~2-6 hours"],
                      ["RATE/1K", `$${Number(selectedService.rate).toFixed(4)}`],
                      ["TYPE", selectedService.type || "Default"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold text-primary">{value}</p>
                      </div>
                    ))}
                  </div>
                  {qty > 0 && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${rawCost.toFixed(4)}</span></div>
                      {couponDiscount > 0 && <div className="flex justify-between text-sm text-primary"><span>Discount</span><span>-${couponDiscount.toFixed(4)}</span></div>}
                      <div className="flex justify-between text-sm font-bold"><span>Total</span><span className="text-primary">${finalCost.toFixed(4)}</span></div>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Wallet Balance</span><span>${balance.toFixed(2)}</span></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a service to see details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-3">
          {services.filter(s => favorites.has(s.id)).length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No favorite services yet.</p>
              <p className="text-xs mt-1">Star services from the order form to add them here.</p>
            </div>
          ) : (
            services.filter(s => favorites.has(s.id)).map(s => (
              <div key={s.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.platform} · ${Number(s.rate).toFixed(4)}/1K</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => { setActiveTab("new"); setSelectedServiceId(s.id); }}>Order</Button>
                  <Button variant="ghost" size="icon" className="text-warning" onClick={() => toggleFavorite(s.id)}>
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
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Auto subscription coming soon.</p>
          <p className="text-xs mt-1">Schedule recurring orders automatically.</p>
        </div>
      )}
    </div>
  );
}
