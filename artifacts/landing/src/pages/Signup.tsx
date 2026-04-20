import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Loader2, ShieldAlert, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { validatePassword } from "@/lib/sanitize";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const referralCode = searchParams.get("ref") ?? "";

  useEffect(() => {
    if (referralCode) {
      apiFetch(`/affiliates/track/${referralCode}`).catch(() => {});
    }
  }, [referralCode]);

  const passwordChecks = useMemo(() => ({
    length:  password.length >= 8,
    letter:  /[a-zA-Z]/.test(password),
    number:  /[0-9]/.test(password),
  }), [password]);

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][passwordStrength];
  const strengthColor = ["", "text-destructive", "text-warning", "text-primary"][passwordStrength];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error("Please accept the Terms of Service to continue."); return; }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { toast.error(pwCheck.message); return; }

    if (!cfToken) {
      toast.error("Please complete the bot verification first.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: name,
          email: email.trim().toLowerCase(),
          password,
          referral_code: referralCode || undefined,
          cf_turnstile_response: cfToken,
          // Honeypot fields — real users never fill these
          website: "",
          phone_confirm: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = typeof data.error === "object"
          ? Object.values(data.error).flat().join(" ")
          : (data.error || "Registration failed.");
        toast.error(errMsg);
        turnstileRef.current?.reset();
        setCfToken(null);
        return;
      }
      toast.success("Account created! Please log in.");
      navigate("/login");
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
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Rocket className="w-8 h-8 text-primary" />
          <span className="text-2xl font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
        </Link>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-heading font-bold text-center mb-6">{t("auth.createAccount")}</h2>

          <form onSubmit={handleSignup} className="space-y-4" autoComplete="on">
            {/* Honeypot fields — visually hidden, bots fill them, humans don't */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              <input type="tel" name="phone_confirm" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">{t("auth.fullName")}</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="bg-secondary/50 mt-1" autoComplete="name" required maxLength={100} />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-secondary/50 mt-1" required autoComplete="email" maxLength={254} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-xs text-muted-foreground">{t("auth.password")}</Label>
                {password && <span className={`text-xs font-medium ${strengthColor}`}>{strengthLabel}</span>}
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 chars, letter + number" className="bg-secondary/50 pr-10" required autoComplete="new-password" minLength={8} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {[
                    { check: passwordChecks.length, label: "At least 8 characters" },
                    { check: passwordChecks.letter, label: "Contains a letter" },
                    { check: passwordChecks.number, label: "Contains a number" },
                  ].map(({ check, label }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${check ? "text-primary" : "text-muted-foreground"}`}>
                      {check ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3 opacity-40" />}
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>{" "}and{" "}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
                I understand that <strong>all deposits are non-refundable</strong>.
              </span>
            </label>

            <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Your IP address and agreement timestamp are recorded for compliance purposes.
            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="flex justify-center">
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
              disabled={loading || passwordStrength < 3 || !cfToken}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("auth.creating")}</>
                : t("auth.createAccount")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">{t("auth.signIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
