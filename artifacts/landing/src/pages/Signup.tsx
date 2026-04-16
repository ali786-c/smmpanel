import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Chrome } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data.session) {
      toast.success("Account created!");
      navigate("/dashboard");
    } else {
      toast.success("Check your email for the confirmation link!");
    }
  };

  const handleGoogleSignup = async () => {
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
          <h2 className="text-xl font-heading font-bold text-center mb-6">{t("auth.createAccount")}</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">{t("auth.fullName")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="bg-secondary/50 mt-1" required />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-secondary/50 mt-1" required />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground">{t("auth.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="bg-secondary/50 mt-1" minLength={6} required />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
              {loading ? t("auth.creating") : t("auth.createAccount")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span></div>
          </div>

          <Button variant="outline" className="w-full gap-2 border-border" onClick={handleGoogleSignup}>
            <Chrome className="w-4 h-4" /> {t("auth.continueWithGoogle")}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.hasAccount")} <Link to="/login" className="text-primary hover:underline font-medium">{t("auth.signIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
