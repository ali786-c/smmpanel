const domain = (import.meta as any).env?.VITE_REPLIT_DEV_DOMAIN || "";
export const API_BASE = domain
  ? `https://${domain}:8000/api`
  : "http://localhost:8000/api";

export function getToken(): string | null {
  return localStorage.getItem("esm_token");
}

export function setToken(token: string): void {
  localStorage.setItem("esm_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("esm_token");
  localStorage.removeItem("esm_user");
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}
