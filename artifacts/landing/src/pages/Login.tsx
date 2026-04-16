import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Mail, Phone, Chrome } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned, ban_reason")
        .eq("user_id", data.user.id)
        .single();
      if (profile?.is_banned) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error(
          profile.ban_reason
            ? `Your account has been suspended: ${profile.ban_reason}`
            : "Your account has been suspended. Please contact support."
        );
        return;
      }
    }
    setLoading(false);
    navigate("/dashboard");
  };

  const handlePhoneOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("OTP sent! Check your phone.");
    }
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Rocket className="w-8 h-8 text-primary" />
          <span className="text-2xl font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
        </Link>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-heading font-bold text-center mb-6">{t("auth.welcomeBack")}</h2>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="w-full mb-6 bg-secondary/50">
              <TabsTrigger value="email" className="flex-1 gap-1.5"><Mail className="w-3.5 h-3.5" /> {t("auth.email")}</TabsTrigger>
              <TabsTrigger value="phone" className="flex-1 gap-1.5"><Phone className="w-3.5 h-3.5" /> {t("auth.phone")}</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">{t("auth.email")}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-secondary/50 mt-1" required />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs text-muted-foreground">{t("auth.password")}</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t("auth.forgotPassword")}</Link>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary/50 mt-1" required />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                  {loading ? t("auth.signingIn") : t("auth.signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-xs text-muted-foreground">{t("auth.phoneNumber")}</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-secondary/50 mt-1" />
                </div>
                <Button className="w-full gradient-primary text-primary-foreground font-semibold" onClick={handlePhoneOtp} disabled={loading}>
                  {loading ? t("auth.sending") : t("auth.sendOtp")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t("auth.orContinueWith")}</span></div>
          </div>

          <Button variant="outline" className="w-full gap-2 border-border" onClick={handleGoogleLogin}>
            <Chrome className="w-4 h-4" /> Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.noAccount")} <Link to="/signup" className="text-primary hover:underline font-medium">{t("auth.signUp")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
