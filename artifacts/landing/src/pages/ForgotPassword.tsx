import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for the reset link!");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Rocket className="w-8 h-8 text-primary" />
          <span className="text-2xl font-heading font-bold">SMM<span className="text-primary">Panel</span></span>
        </Link>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-heading font-bold text-center mb-2">Reset Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter your email to receive a reset link</p>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-primary">Reset link sent! Check your inbox.</p>
              <Link to="/login">
                <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-secondary/50 mt-1" required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
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
