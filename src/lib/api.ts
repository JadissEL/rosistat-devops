// Centralized API helper for frontend
// Uses Vite env var VITE_API_BASE to prefix API calls

export const API_BASE: string = import.meta.env?.VITE_API_BASE ?? "";

// Typed API shapes based on backend/dao.ts and endpoints
export interface SimulationRow {
  id: number;
  userId?: string | null;
  strategy: string;
  startingInvestment: number;
  finalEarnings: number;
  finalPortfolio: number;
  totalSpins: number;
  settings: Record<string, unknown>;
  timestamp: string; // ISO string from SQLite
}

export interface SpinRow {
  id: number;
  simulationId: number;
  spinNumber: number;
  drawnNumber: number;
  spinNetResult: number;
  cumulativeEarnings: number;
  raw: Record<string, unknown>;
}

export interface SpinsStats {
  totalSpins: number;
  firstSpin: number | null;
  lastSpin: number | null;
  minEarnings: number | null;
  maxEarnings: number | null;
  avgNetResult: number | null;
}

export interface GetSimulationWithSpinsResponse {
  simulation: SimulationRow;
  spins: SpinRow[];
}

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

export async function apiHealth(): Promise<{ status: string; env?: string; dbReady?: boolean }> {
  return apiGet("/api/health");
}

// Simulation API helpers
export const apiGetSimulations = (userId?: string) => {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiGet<SimulationRow[]>(`/api/simulations${query}`);
};

export const apiGetSimulation = (id: number) => apiGet<GetSimulationWithSpinsResponse>(`/api/simulations/${id}`);

export interface SimulationCreateRequest {
  userId?: string | null;
  strategy: string;
  startingInvestment: number;
  finalEarnings: number;
  finalPortfolio: number;
  totalSpins: number;
  settings: Record<string, unknown>;
  // Optional per-spin results
  results?: Array<{
    spin?: number;
    drawnNumber?: number;
    spinNetResult?: number;
    cumulativeEarnings?: number;
    // include any additional raw fields
    [key: string]: unknown;
  }>;
}

export const apiCreateSimulation = (data: SimulationCreateRequest) => apiPost<{ ok: true; id: number }>("/api/simulations", data);

export const apiGetSimulationSpins = (id: number, limit?: number, offset?: number) => {
  const params = new URLSearchParams();
  if (typeof limit === "number") params.set("limit", limit.toString());
  if (typeof offset === "number") params.set("offset", offset.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiGet<SpinRow[]>(`/api/simulations/${id}/spins${query}`);
};

export const apiGetSimulationStats = (id: number) => apiGet<SpinsStats>(`/api/simulations/${id}/spins/stats`);


