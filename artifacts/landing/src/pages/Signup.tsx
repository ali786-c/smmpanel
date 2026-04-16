import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Loader2, ShieldAlert } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Registration failed. Please try again.");
        return;
      }
      toast.success("Account created! Please log in.");
      navigate("/login");
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
          <h2 className="text-xl font-heading font-bold text-center mb-6">{t("auth.createAccount")}</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">{t("auth.fullName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-secondary/50 mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">{t("auth.email")}</Label>
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
              <Label htmlFor="password" className="text-xs text-muted-foreground">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="bg-secondary/50 mt-1"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>

            {/* No-refund acknowledgement — legally required */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I have read and agree to the{" "}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
                I understand that <strong>all deposits are non-refundable</strong>.
              </span>
            </label>

            <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              By creating an account your IP address and agreement timestamp are recorded for compliance.
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("auth.creating")}</> : t("auth.createAccount")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
