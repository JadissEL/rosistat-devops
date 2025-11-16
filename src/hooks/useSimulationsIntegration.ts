import { useSimulations, useSimulation, useCachedSimulations, useCachedSimulation } from "@/hooks/useSimulations";
import { SimulationRow } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook: Get simulations list with smart caching
 * Integrates with AuthContext for user-specific data
 * Handles loading and error states automatically
 */
export function useSimulationsList() {
  const { currentUser } = useAuth();

  // Get user simulations if authenticated, otherwise all public simulations
  const userId = currentUser?.uid;
  const {
    data: simulations = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isStale,
  } = useSimulations(userId);

  return {
    simulations,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isStale,
    isEmpty: simulations.length === 0,
  };
}

/**
 * Hook: Get single simulation with smart caching
 * Provides detail view with all spins data
 */
export function useSimulationDetail(id: number) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isStale,
  } = useSimulation(id);

  return {
    simulation: data?.simulation,
    spins: data?.spins || [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isStale,
    hasData: !!data,
  };
}

/**
 * Hook: Use cached data immediately without API call
 * Returns undefined if not in cache
 */
export function useCachedSimulationData(id: number) {
  const { currentUser } = useAuth();
  const cached = useCachedSimulation(id);
  const cachedList = useCachedSimulations(currentUser?.uid);

  return {
    simulation: cached,
    simulations: cachedList || [],
  };
}
