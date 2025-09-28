// Centralized API helper for frontend
// Uses Vite env var VITE_API_BASE to prefix API calls

export const API_BASE: string = (import.meta as any).env?.VITE_API_BASE || "";

function buildUrl(path: string): string {
  if (!API_BASE) return path; // allow relative paths if not configured
  const slash = path.startsWith("/") ? "" : "/";
  return `${API_BASE}${slash}${path}`;
}

export async function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), { ...init, method: "GET" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiHealth(): Promise<{ status: string; env?: string }> {
  return apiGet("/api/health");
}

// Simulation API helpers
export const apiGetSimulations = () => apiGet<any[]>("/api/simulations");
export const apiGetSimulation = (id: number) => apiGet<any>(`/api/simulations/${id}`);
export const apiCreateSimulation = (data: any) => apiPost<any>("/api/simulations", data);
export const apiGetSimulationSpins = (id: number, limit?: number, offset?: number) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (offset) params.set('offset', offset.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<any[]>(`/api/simulations/${id}/spins${query}`);
};
export const apiGetSimulationStats = (id: number) => apiGet<any>(`/api/simulations/${id}/spins/stats`);


