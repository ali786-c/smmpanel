import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json();
        toast.error(d.message || "Unable to send reset link. Try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Rocket className="w-8 h-8 text-primary" />
          <span className="text-2xl font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
        </Link>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-heading font-bold text-center mb-2">Reset Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter your email to receive a reset link</p>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <p className="text-sm text-foreground font-medium">Reset link sent!</p>
              <p className="text-xs text-muted-foreground">Check your inbox and follow the link to set a new password.</p>
              <Link to="/login">
                <Button variant="outline" className="gap-2 mt-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
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
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : "Send Reset Link"}
              </Button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
