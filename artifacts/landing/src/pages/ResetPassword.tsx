import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid or expired reset link.");
      navigate("/forgot-password");
    }
  }, [token, email, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, email, password, password_confirmation: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Reset failed. The link may have expired.");
        return;
      }
      toast.success("Password updated! Please log in.");
      navigate("/login");
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
          <h2 className="text-xl font-heading font-bold text-center mb-6">Set New Password</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground">New Password</Label>
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
            <div>
              <Label htmlFor="confirm" className="text-xs text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="bg-secondary/50 mt-1"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...</> : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
