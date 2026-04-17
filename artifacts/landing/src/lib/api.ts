// Use the app's own base path + a proxy segment so all requests
// stay on the same origin and pass through the Vite dev-server proxy.
// BASE_URL = "/landing/" in dev and production.
export const API_BASE = `${import.meta.env.BASE_URL}api`;

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

export function loginUser(token: string, user: unknown): void {
  localStorage.setItem("esm_token", token);
  localStorage.setItem("esm_user", JSON.stringify(user));
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
