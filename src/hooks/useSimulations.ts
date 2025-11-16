import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetSimulations,
  apiGetSimulation,
  apiCreateSimulation,
  apiGetSimulationSpins,
  apiGetSimulationStats,
  SimulationRow,
  SimulationCreateRequest,
  GetSimulationWithSpinsResponse,
  SpinRow,
  SpinsStats,
} from "@/lib/api";

/**
 * React Query hooks for simulations API
 * Configuration:
 * - staleTime: 5 minutes (300000ms)
 * - cacheTime: 10 minutes (600000ms) [old: cacheTime, now: gcTime]
 * - refetchOnWindowFocus: false (to avoid unnecessary refetches)
 * - refetchInterval: off (manual refetch only)
 */

const QUERY_KEYS = {
  all: ["simulations"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (userId?: string) => [...QUERY_KEYS.lists(), { userId }] as const,
  details: () => [...QUERY_KEYS.all, "detail"] as const,
  detail: (id: number) => [...QUERY_KEYS.details(), id] as const,
  spins: () => [...QUERY_KEYS.all, "spins"] as const,
  spinsList: (id: number) => [...QUERY_KEYS.spins(), { id }] as const,
  spinsStats: () => [...QUERY_KEYS.all, "spins-stats"] as const,
  spinsStat: (id: number) => [...QUERY_KEYS.spinsStats(), id] as const,
};

/**
 * Hook: Get all simulations (optionally filtered by userId)
 * @param userId Optional user ID to filter simulations
 * @returns Query object with simulations list
 */
export function useSimulations(userId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.list(userId),
    queryFn: () => apiGetSimulations(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook: Get a single simulation with all its spins
 * @param id Simulation ID
 * @returns Query object with simulation and spins data
 */
export function useSimulation(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => apiGetSimulation(id),
    staleTime: 10 * 60 * 1000, // 10 minutes (detail view less frequently changes)
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: id > 0, // Only run if id is valid
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook: Get spins for a specific simulation with pagination support
 * @param id Simulation ID
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Query object with spins array
 */
export function useSimulationSpins(
  id: number,
  limit?: number,
  offset?: number,
) {
  return useQuery({
    queryKey: QUERY_KEYS.spinsList(id),
    queryFn: () => apiGetSimulationSpins(id, limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: id > 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
  });
}

/**
 * Hook: Get statistics for spins of a specific simulation
 * @param id Simulation ID
 * @returns Query object with spins statistics
 */
export function useSimulationStats(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.spinsStat(id),
    queryFn: () => apiGetSimulationStats(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
    enabled: id > 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
  });
}

/**
 * Hook: Create a new simulation
 * Invalidates the simulations list after creation
 * @returns Mutation object for creating simulations
 */
export function useCreateSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SimulationCreateRequest) => apiCreateSimulation(data),
    onSuccess: (response, variables) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.lists(),
      });

      // Optionally cache the newly created simulation
      queryClient.setQueryData(QUERY_KEYS.detail(response.id), {
        simulation: {
          id: response.id,
          ...variables,
          timestamp: new Date().toISOString(),
        } as SimulationRow,
        spins: [],
      } as GetSimulationWithSpinsResponse);
    },
    onError: (error) => {
      console.error("Error creating simulation:", error);
    },
  });
}

/**
 * Hook: Prefetch a simulation for faster navigation
 * Useful for optimistic rendering
 * @param id Simulation ID to prefetch
 */
export function usePrefetchSimulation(id: number) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.detail(id),
      queryFn: () => apiGetSimulation(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook: Invalidate simulations cache
 * Force refetch on demand
 */
export function useInvalidateSimulations() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.all,
      }),
    invalidateLists: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.lists(),
      }),
    invalidateDetail: (id: number) =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.detail(id),
      }),
    invalidateSpins: (id: number) =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.spinsList(id),
      }),
  };
}

/**
 * Hook: Get cached simulation data directly without refetching
 * Useful for immediate access to cached data
 */
export function useCachedSimulation(id: number) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<GetSimulationWithSpinsResponse>(
    QUERY_KEYS.detail(id),
  );
}

/**
 * Hook: Get cached simulations list without refetching
 */
export function useCachedSimulations(userId?: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<SimulationRow[]>(
    QUERY_KEYS.list(userId),
  );
}
