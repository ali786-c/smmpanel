import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { loginUser } from "@/hooks/useAuth";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Login failed. Check your credentials.");
        return;
      }
      loginUser(data.token, data.user);
      toast.success("Welcome back!");
      const roles: string[] = data.user?.roles ?? [];
      navigate(roles.includes("admin") ? "/admin" : "/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary/50 mt-1"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> {t("auth.password")}
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary/50 mt-1"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("auth.signingIn")}</> : t("auth.signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.noAccount")}{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              {t("auth.signUp")}
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo accounts (click to fill)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail("user@emazingsm.com"); setPassword("User1234!"); }}
                className="text-xs px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary text-left transition-colors border border-border/30"
              >
                <span className="block font-medium text-foreground">👤 Regular User</span>
                <span className="text-muted-foreground">→ User Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail("admin@emazingsm.com"); setPassword("Admin1234!"); }}
                className="text-xs px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-left transition-colors border border-primary/20"
              >
                <span className="block font-medium text-primary">🛡️ Admin User</span>
                <span className="text-muted-foreground">→ Admin Panel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
