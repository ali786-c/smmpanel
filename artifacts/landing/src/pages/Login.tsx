import { useState, useRef } from "react";
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
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cfToken) {
      toast.error("Please complete the bot verification first.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          cf_turnstile_response: cfToken,
          // Honeypot fields — left empty by real users
          website: "",
          phone_confirm: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || "Login failed. Check your credentials.");
        turnstileRef.current?.reset();
        setCfToken(null);
        return;
      }
      loginUser(data.token, data.user);
      toast.success("Welcome back!");
      const roles: string[] = data.user?.roles ?? [];
      navigate(roles.includes("admin") ? "/admin" : "/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
      turnstileRef.current?.reset();
      setCfToken(null);
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
            {/* Honeypot fields — visually hidden, bots fill them, humans don't */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              <input type="tel" name="phone_confirm" tabIndex={-1} autoComplete="off" />
            </div>

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

            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="flex justify-center pt-1">
              <Turnstile
                ref={turnstileRef}
                siteKey={SITE_KEY}
                onSuccess={(token) => setCfToken(token)}
                onExpire={() => { setCfToken(null); toast.error("Verification expired. Please verify again."); }}
                onError={() => { setCfToken(null); toast.error("Verification failed. Please try again."); }}
                options={{ theme: "auto", size: "normal" }}
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold"
              disabled={loading || !cfToken}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("auth.signingIn")}</>
                : t("auth.signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.noAccount")}{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              {t("auth.signUp")}
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
