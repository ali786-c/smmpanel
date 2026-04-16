import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    apiFetch("/profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const roles: string[] = d?.roles ?? [];
        setIsAdmin(roles.includes("admin"));
      })
      .catch(() => setIsAdmin(false));
  }, [user]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
