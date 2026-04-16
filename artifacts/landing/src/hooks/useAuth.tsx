import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, clearToken, getToken, setToken } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    apiFetch("/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function loginUser(token: string, user: AuthUser) {
  setToken(token);
  localStorage.setItem("esm_user", JSON.stringify(user));
}

export const useAuth = () => useContext(AuthContext);
